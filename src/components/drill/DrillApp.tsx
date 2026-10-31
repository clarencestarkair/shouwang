"use client";
/**
 * 反诈演练：和“AI 骗子”过招。
 * 交互模式创新——从“被动提醒”到“主动免疫”：老人在零风险环境里亲身经历一次骗局，
 * 演练结束后由 AI 教练复盘打分，指出关键破绽。
 */
import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, ArrowRight, ArrowUp, Loader2, MessageSquare, Mic, Phone, ShieldAlert, Sparkles, Video, Users } from "lucide-react";
import { Gauge } from "@/components/common/RiskGauge";
import { Markdown } from "@/components/common/Markdown";
import { useSpeechInput } from "@/lib/client/speech";
import type { DrillReview } from "@/lib/ai/schemas";
import { FRAUD_TYPES, type FraudType } from "@/lib/core/types";
import { cn } from "@/lib/utils";

export interface DrillScenario {
  id: string;
  type: FraudType;
  title: string;
  channel: string;
  hint: string;
}

const START = "【开始演练】";
const CHANNEL_ICON: Record<string, typeof Phone> = { 电话: Phone, 视频通话: Video, 微信: MessageSquare, 短信: MessageSquare, 线下: Users };

export function DrillApp({ scenarios }: { scenarios: DrillScenario[] }) {
  const [scenario, setScenario] = useState<DrillScenario | null>(null);
  if (!scenario) return <ScenarioPicker scenarios={scenarios} onPick={setScenario} />;
  return <DrillSession key={scenario.id} scenario={scenario} onExit={() => setScenario(null)} />;
}

function ScenarioPicker({ scenarios, onPick }: { scenarios: DrillScenario[]; onPick: (s: DrillScenario) => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2 shadow-sm">
          <Sparkles className="size-3.5 text-accent" aria-hidden /> AI 角色扮演 · 剧本来自案例库
        </p>
        <h1 className="mt-4 text-[2.4rem] font-semibold leading-[1.15] tracking-tight sm:text-[3rem]">
          跟“骗子”过过招，
          <br />
          真遇上了不慌。
        </h1>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-ink-2">守望会扮演一个骗子，用真实案例里的说法来“骗”您。照平常的样子回答就行——这里不会真的转钱。结束后，AI 教练会告诉您哪里做得好、哪里要当心。</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s) => {
          const Icon = CHANNEL_ICON[s.channel] ?? Phone;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s)}
                className="group flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-ink-3">{FRAUD_TYPES[s.type]}</span>
                </span>
                <span className="mt-5 text-[1.15rem] font-semibold leading-snug tracking-tight">{s.title}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-ink-3">{s.hint}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-accent">
                  开始演练 <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DrillSession({ scenario, onExit }: { scenario: DrillScenario; onExit: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/drill", body: { caseId: scenario.id } }), [scenario.id]);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const [review, setReview] = useState<DrillReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const busy = status === "submitted" || status === "streaming";

  const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const visible = messages.filter((m) => !(m.role === "user" && textOf(m) === START));
  const ended = messages.some((m) => m.role === "assistant" && /【演练(结束|暂停)】/.test(textOf(m)));
  const started = messages.length > 0;
  const Icon = CHANNEL_ICON[scenario.channel] ?? Phone;

  const send = (t: string) => {
    if (!t.trim() || busy || ended) return;
    sendMessage({ text: t.trim() });
    setInput("");
  };
  const speech = useSpeechInput(send);

  const finish = async () => {
    setReviewing(true);
    setReviewError(null);
    const transcript = visible.map((m) => ({ role: m.role === "assistant" ? ("scammer" as const) : ("learner" as const), text: textOf(m) }));
    try {
      const res = await fetch("/api/drill/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: scenario.id, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "点评失败");
      setReview(data.review);
    } catch (e) {
      setReviewError((e as Error).message);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-h-[72dvh] flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-md">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <button type="button" onClick={onExit} aria-label="返回选择" className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink">
            <ArrowLeft className="size-5" />
          </button>
          <span className="grid size-10 place-items-center rounded-full bg-surface-3 text-ink-2">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">陌生来电</p>
            <p className="text-xs text-ink-3">演练模式 · 不会产生任何真实操作</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
            <ShieldAlert className="size-3.5" aria-hidden /> 模拟骗局
          </span>
        </header>

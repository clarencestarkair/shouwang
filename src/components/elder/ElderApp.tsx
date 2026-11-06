"use client";
/**
 * 长辈端主界面：一问一答，结论以“风险仪表 + 大字”呈现。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { ArrowRight, ChevronDown, Cpu, Settings2, Volume2 } from "lucide-react";
import { Markdown } from "@/components/common/Markdown";
import type { GuardianRequestBody, GuardianUIMessage } from "@/lib/ai/messages";
import { maskPII } from "@/lib/core/safety";
import { prepareImage } from "@/lib/client/image";
import { speak, stopSpeaking } from "@/lib/client/speech";
import { useSettings } from "@/lib/stores/settings";
import { AgentTrace } from "./AgentTrace";
import { Composer, type ComposerSubmit } from "./Composer";
import { VerdictField } from "@/components/analysis/VerdictField";
import { ScamProgress } from "@/components/analysis/ScamProgress";
import { EvidenceView } from "@/components/analysis/EvidenceView";
import { AgentConsole } from "@/components/analysis/AgentConsole";
import { deriveAnalysis } from "@/components/analysis/derive";
import { SettingsPanel } from "./SettingsPanel";
import { EXAMPLES } from "./examples";

const FONT_PX = { 1: 18, 2: 20, 3: 23 } as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function ElderApp() {
  const settings = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [hello, setHello] = useState("您好");
  const bottomRef = useRef<HTMLDivElement>(null);

  // 字号档位作用于根字号，所有 rem 尺寸随之等比放大
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.fontSize;
    el.style.fontSize = `${FONT_PX[settings.fontLevel]}px`;
    return () => {
      el.style.fontSize = prev;
    };
  }, [settings.fontLevel]);

  useEffect(() => setHello(greeting()), []);

  const transport = useMemo(() => new DefaultChatTransport<GuardianUIMessage>({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat<GuardianUIMessage>({ transport });
  const busy = status === "submitted" || status === "streaming";

  // 有对话时才跟随到底部；首屏不滚动，保证老人先看到问候与说明
  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => () => stopSpeaking(), []);

  const submit = ({ text, images }: ComposerSubmit) => {
    // 端侧隐私保护：发送前在浏览器里完成脱敏
    const masked = maskPII(text);
    const files: FileUIPart[] = images.map((img) => ({ type: "file", mediaType: img.mediaType, url: img.dataUrl, filename: img.name }));
    const body: GuardianRequestBody = {
      profile: { elderName: settings.elderName },
      clientSide: { qr: images.map((i) => i.qr).filter((x): x is string => Boolean(x)), masked: masked.masked },
    };
    sendMessage({ text: masked.text || (images.length ? "帮我看看这张图是不是骗子" : ""), files }, { body });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-start justify-between gap-4 pb-2 pt-10">
        <div>
          <p className="text-[1rem] font-medium text-ink-3">
            {hello}，{settings.elderName}
          </p>
          <h1 className="mt-1.5 text-[1.9rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem]">拿不准的消息，发给我看看</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          aria-expanded={showSettings}
          aria-label="设置"
          className="mt-1 grid size-12 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 shadow-sm transition-colors hover:text-ink"
        >
          <Settings2 className="size-5" />
        </button>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <main className="flex-1 space-y-7 py-7" aria-live="polite">
        {messages.length === 0 && (
          <EmptyState
            onPick={(t) => submit({ text: t, images: [] })}
            onPickImage={async (src, text) => {
              // 演示截图走与真实上传完全相同的端侧流程：压缩 + 二维码解析
              const blob = await (await fetch(src)).blob();
              const img = await prepareImage(new File([blob], src.split("/").pop() ?? "demo.png", { type: blob.type }));
              submit({ text, images: [img] });
            }}
          />
        )}

        {messages.map((m, idx) =>
          m.role === "user" ? (
            <UserBubble key={m.id} message={m} />
          ) : (
            <AssistantTurn key={m.id} message={m} userMessage={messages[idx - 1]} busy={busy && idx === messages.length - 1} />
          ),
        )}

        {status === "submitted" && messages[messages.length - 1]?.role === "user" && <AgentTrace parts={[]} busy />}

        {error && (
          <div role="alert" className="rounded-2xl border border-danger/20 bg-danger-soft px-5 py-4 text-[1.02rem] text-ink">
            网络好像不太好，没能看完。如果事情紧急，请直接拨打{" "}
            <a className="font-semibold text-danger underline underline-offset-2" href="tel:96110">
              96110
            </a>{" "}
            反诈专线。
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg/95 to-bg/0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:-mx-6 sm:px-6">
        <Composer onSubmit={submit} busy={busy} onStop={stop} />
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: GuardianUIMessage }) {
  const text = message.parts.filter((p) => p.type === "text").map((p) => p.text).join("\n");
  const files = message.parts.filter((p) => p.type === "file");
  return (
    <div className="animate-rise ml-auto flex max-w-[85%] flex-col items-end gap-2">
      {files.map((f, i) =>
        f.type === "file" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={f.url} alt="您发来的图片" className="max-h-60 rounded-2xl object-cover shadow-md ring-1 ring-line" />
        ) : null,
      )}
      {text && <p className="whitespace-pre-wrap rounded-[1.4rem] rounded-br-md bg-ink px-5 py-3.5 text-[1.08rem] leading-relaxed text-surface shadow-sm">{text}</p>}
    </div>
  );
}

function AssistantTurn({ message, userMessage, busy }: { message: GuardianUIMessage; userMessage?: GuardianUIMessage; busy: boolean }) {
  const a = deriveAnalysis(message, userMessage, busy);
  const [showConsole, setShowConsole] = useState(false);
  const report = a.report;
  const writingReport = !report && a.tools.some((t) => t.name === "submitRiskReport");

  return (
    <div className="space-y-5">
      <AgentTrace parts={message.parts} busy={busy && !report} />
      {writingReport && <div className="h-64 animate-pulse rounded-[2rem] bg-surface-2" aria-label="正在写结论" />}
      {report && <VerdictField report={report} notified={a.notified} fallback={a.fallback} />}
      {report && <ScamProgress stage={report.scamStage ?? 0} nextMove={report.nextMove} />}
      {report && <EvidenceView source={a.sourceText} report={report} signals={a.rules?.signals ?? []} />}
      {a.finalText && (
        <div className="animate-rise flex gap-3.5">
          <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[0.75rem] font-semibold text-surface">守</span>
          <Markdown className="min-w-0 flex-1 text-[1.08rem] leading-[1.85] text-ink [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:font-semibold">{a.finalText}</Markdown>
          {!busy && (
            <button type="button" onClick={() => speak(a.finalText)} aria-label="朗读这段话" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-2 hover:text-ink">
              <Volume2 className="size-4" />
            </button>
          )}
        </div>
      )}
      {(report || a.tools.length > 0) && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowConsole((v) => !v)}
            aria-expanded={showConsole}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[0.85rem] font-medium text-ink-2 shadow-sm hover:text-ink"
          >
            <Cpu className="size-4" aria-hidden /> AI 是怎么判断的
            <ChevronDown className={`size-4 transition-transform ${showConsole ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {showConsole && <AgentConsole a={a} className="animate-rise" />}
        </div>
      )}
    </div>
  );
}

const DEMO_IMAGES = [
  { src: "/demo/sms-yibao.png", label: "医保卡“冻结”短信截图", text: "帮我看看这条短信" },
  { src: "/demo/poster-qr.png", label: "小区门口发的福利传单", text: "楼下发的传单，说扫码能领补贴，是真的吗" },
];

function EmptyState({ onPick, onPickImage }: { onPick: (text: string) => void; onPickImage: (src: string, text: string) => void }) {
  return (
    <section className="animate-rise space-y-12">
      <ul className="grid gap-3 sm:grid-cols-3">
        <ModeCard title="说给我听" desc="按住下方黑色按钮，把对方说的话讲给我">
          <div className="flex h-full items-center justify-center gap-[3px]" aria-hidden>
            {[10, 22, 36, 18, 44, 28, 52, 30, 40, 16, 34, 24, 12, 26, 8].map((h, i) => (
              <span key={i} className="w-[5px] rounded-full bg-ink" style={{ height: h, opacity: 0.35 + (h / 52) * 0.65 }} />
            ))}
          </div>
        </ModeCard>
        <ModeCard title="拍给我看" desc="短信、聊天记录、传单，拍照或截图">
          <div className="relative h-full" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/sms-yibao.png" alt="" className="absolute left-[24%] top-3 h-[86%] -rotate-6 rounded-md object-cover object-top shadow-md ring-1 ring-line" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/poster-qr.png" alt="" className="absolute left-[46%] top-2 h-[86%] rotate-[5deg] rounded-md object-cover shadow-md ring-1 ring-line" />
          </div>
        </ModeCard>
        <ModeCard title="粘贴过来" desc="复制可疑短信，粘贴到下面的框里">
          <div className="flex h-full flex-col justify-center gap-1.5 px-5" aria-hidden>
            <span className="w-[85%] rounded-xl rounded-bl-sm bg-surface px-3 py-2 text-[0.72rem] leading-snug text-ink-2 shadow-sm ring-1 ring-line">【医保服务】您的医保卡即将停用，请登录…</span>
            <span className="ml-auto rounded-full bg-ink px-2.5 py-1 text-[0.68rem] font-medium text-surface">粘贴</span>
          </div>
        </ModeCard>
      </ul>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[1.3rem] font-semibold tracking-tight">试试这些真实的骗局</h2>
          <p className="text-[0.85rem] text-ink-3">点一下，守望就开始分析</p>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_IMAGES.map((d) => (
            <li key={d.src}>
              <button type="button" onClick={() => onPickImage(d.src, d.text)} className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="relative block h-28 overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.src} alt="" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-0.5 text-[0.7rem] font-medium text-surface backdrop-blur">图片</span>
                </span>
                <span className="flex flex-1 items-center justify-between gap-3 p-4">
                  <span className="text-[0.98rem] font-medium leading-snug text-ink">{d.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </button>
            </li>
          ))}
          {EXAMPLES.map((ex) => (
            <li key={ex.label}>
              <button type="button" onClick={() => onPick(ex.text)} className="group flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex items-center justify-between">
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[0.75rem] font-medium text-ink-2">{ex.label}</span>
                  <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-3 line-clamp-3 text-[0.95rem] leading-relaxed text-ink">“{ex.text}”</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

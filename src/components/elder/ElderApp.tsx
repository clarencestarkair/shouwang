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

"use client";
/**
 * Agent 指挥台页面：左边是老人手机上看到的画面，右边是同一次分析的完整 AI 过程。
 * 用于评审演示——一次输入，同时看到“产品体验”和“技术深度”。
 */
import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, ImageIcon, RotateCcw } from "lucide-react";
import type { GuardianRequestBody, GuardianUIMessage } from "@/lib/ai/messages";
import { maskPII } from "@/lib/core/safety";
import { prepareImage } from "@/lib/client/image";
import { EXAMPLES } from "@/components/elder/examples";
import { AgentConsole } from "./AgentConsole";
import { PhonePreview } from "./PhonePreview";
import { deriveAnalysis } from "./derive";
import { cn } from "@/lib/utils";

const IMAGES = [
  { src: "/demo/sms-yibao.png", label: "医保短信截图", text: "帮我看看这条短信" },
  { src: "/demo/poster-qr.png", label: "带二维码的传单", text: "楼下发的传单，说扫码能领补贴，是真的吗" },
];

export function ConsoleApp() {
  const transport = useMemo(() => new DefaultChatTransport<GuardianUIMessage>({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, setMessages } = useChat<GuardianUIMessage>({ transport });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  const lastIdx = messages.findLastIndex((m) => m.role === "assistant");
  const analysis = lastIdx >= 0 ? deriveAnalysis(messages[lastIdx], messages[lastIdx - 1], busy && lastIdx === messages.length - 1) : null;
  const pending = busy && (lastIdx < 0 || messages[messages.length - 1].role === "user");

  const run = async (text: string, image?: string) => {
    if (busy) return;
    setMessages([]);
    const files = [];
    const qr: string[] = [];
    if (image) {
      const blob = await (await fetch(image)).blob();
      const img = await prepareImage(new File([blob], image.split("/").pop() ?? "demo.png", { type: blob.type }));
      files.push({ type: "file" as const, mediaType: img.mediaType, url: img.dataUrl, filename: img.name });
      if (img.qr) qr.push(img.qr);
    }
    const masked = maskPII(text);
    const body: GuardianRequestBody = { profile: { elderName: "妈妈" }, clientSide: { qr, masked: masked.masked } };
    sendMessage({ text: masked.text, files }, { body });
    setInput("");
  };

  return (
    <div className="relative mx-auto max-w-[90rem] px-4 pb-16 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.6_0.18_258/0.25),transparent)]" />
      <header className="relative flex flex-wrap items-end justify-between gap-4 pb-8 pt-10">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-accent">Agent Console</p>
          <h1 className="mt-2 text-[2.2rem] font-semibold tracking-tight sm:text-[2.8rem]">一次分析，两种视角</h1>
          <p className="mt-2 max-w-xl text-ink-2">左边是老人手机上看到的结论，右边是多智能体流水线的每一步：谁在工作、调用了什么工具、检索到哪些案例、耗时多少。</p>
        </div>
        {messages.length > 0 && !busy && (
          <button type="button" onClick={() => setMessages([])} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink-2 hover:text-ink">
            <RotateCcw className="size-3.5" /> 清空
          </button>
        )}
      </header>

      {/* 场景选择 */}
      <div className="relative flex flex-wrap gap-2">
        {IMAGES.map((x) => (
          <button key={x.src} type="button" disabled={busy} onClick={() => run(x.text, x.src)} className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] text-ink disabled:opacity-40">
            <ImageIcon className="size-3.5 text-accent" /> {x.label}
          </button>
        ))}
        {EXAMPLES.slice(0, 5).map((x) => (
          <button key={x.label} type="button" disabled={busy} onClick={() => run(x.text)} className="glass rounded-full px-3.5 py-2 text-[13px] text-ink disabled:opacity-40">
            {x.label}：{x.text.slice(0, 12)}…
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) run(input.trim());
        }}
        className="glass relative mt-3 flex items-center gap-2 rounded-2xl p-1.5 pl-4"
      >
        <label htmlFor="console-input" className="sr-only">
          输入要分析的内容
        </label>
        <input id="console-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="粘贴任意可疑短信、通话内容…" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3" />
        <button type="submit" disabled={busy || !input.trim()} aria-label="开始分析" className={cn("grid size-10 place-items-center rounded-xl", input.trim() && !busy ? "bg-accent text-bg" : "bg-surface-3 text-ink-3")}>
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </form>

      <div className="relative mt-8 grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-start">
        <div className="xl:sticky xl:top-24">
          <PhonePreview a={pending ? null : analysis} idle={!busy && messages.length === 0} />
          <p className="mt-4 text-center text-[12px] text-ink-3">老人看到的画面</p>
        </div>
        {analysis ? (
          <AgentConsole a={analysis} />
        ) : (
          <div className="glass grid min-h-[28rem] place-items-center rounded-[1.75rem] p-8 text-center">
            <div>
              <p className="text-[1.15rem] font-semibold">{pending ? "流水线启动中…" : "选择一个场景，观察 Agent 如何工作"}</p>
              <p className="mt-2 text-[13px] text-ink-3">节点图、时间线、规则命中、检索相似度、号码链接核验、双通道校验会在这里实时出现</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

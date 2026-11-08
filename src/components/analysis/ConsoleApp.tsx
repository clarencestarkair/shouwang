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

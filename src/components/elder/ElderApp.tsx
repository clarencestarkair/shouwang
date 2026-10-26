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

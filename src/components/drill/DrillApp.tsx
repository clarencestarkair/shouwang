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

function DrillSession({ scenario, onExit }: { scenario: DrillScenario; onExit: () => void }) {
  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/drill", body: { caseId: scenario.id } }), [scenario.id]);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const [review, setReview] = useState<DrillReview | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const busy = status === "submitted" || status === "streaming";

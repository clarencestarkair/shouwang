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

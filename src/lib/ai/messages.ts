/**
 * 前后端共享的 UI 消息类型（类型安全的流式协议）。
 * data-* 部分用于“AI 思考过程可视化”：多模态感知、规则初筛、兜底报告等。
 */
import type { InferUITools, UIMessage } from "ai";
import type { RiskReport, RiskSignal } from "@/lib/core/types";
import type { GuardianTools } from "./tools";

export type TraceStepId = "privacy" | "perception" | "rules" | "agent" | "guard";

export interface TraceData {
  step: TraceStepId;
  status: "running" | "done" | "skipped" | "error";
  title: string;
  detail?: string;
  /** 距请求开始的毫秒数（服务端计时） */
  at?: number;
}

/** 工具调用的服务端计时 */
export interface ToolTimeData {
  toolCallId: string;
  toolName: string;
  startAt: number;
  endAt?: number;
  durationMs?: number;
}

/** 助手消息元数据：模型与 token 用量（指挥台展示） */
export interface GuardianMetadata {
  model?: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  totalMs?: number;
}

export interface PerceptionData {
  images: number;
  text: string;
  qr: string[];
}

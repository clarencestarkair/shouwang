/**
 * 前后端共享的 UI 消息类型（类型安全的流式协议）。
 * data-* 部分用于“AI 思考过程可视化”：多模态感知、规则初筛、兜底报告等。
 */
import type { InferUITools, UIMessage } from "ai";
import type { RiskReport, RiskSignal } from "@/lib/core/types";
import type { GuardianTools } from "./tools";

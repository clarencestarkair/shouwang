"use client";
/**
 * AI 指挥台：把一次分析的多智能体流水线完整摊开——
 * 节点图（谁在工作）→ 甘特时间线（每步耗时，来自服务端计时）→ 规则命中 → 检索结果与相似度
 * → 号码/链接核验 → 双通道校验与安全审查 → 模型用量。
 * 数据全部来自真实的流式消息，没有任何模拟值。
 */
import type { ReactNode } from "react";
import { Bell, Brain, Database, Eye, FileCheck2, Gauge as GaugeIcon, Link2, Lock, MessageSquareText, Phone, ScanText, ShieldCheck } from "lucide-react";
import { FRAUD_TYPES, RISK_LABEL } from "@/lib/core/types";
import { cn } from "@/lib/utils";
import { perceptionPlain, type Analysis } from "./derive";

type NodeState = "idle" | "running" | "done" | "skipped" | "error";

interface GNode {
  key: string;
  label: string;
  sub: string;
  icon: typeof Brain;
  state: NodeState;
  ms?: number;
}

function toolState(state: string): NodeState {
  return state === "output-available" ? "done" : state === "output-error" ? "error" : "running";
}

const fmtMs = (ms?: number) => (ms === undefined ? "" : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`);

export function AgentConsole({ a, className }: { a: Analysis; className?: string }) {
  const hasImage = Boolean(a.perception) || Boolean(a.traces.perception);
  const toolNodes: GNode[] = a.tools
    .filter((t) => t.name !== "submitRiskReport" && t.name !== "notifyFamily")
    .map((t) => ({
      key: t.id,
      label: t.name === "searchFraudCases" ? "案例检索" : t.name === "checkPhoneNumber" ? "号码核验" : "链接核验",
      sub: t.name === "searchFraudCases" ? "RAG · BM25 + 向量" : t.name === "checkPhoneNumber" ? "Function Calling" : "Function Calling",
      icon: t.name === "searchFraudCases" ? Database : t.name === "checkPhoneNumber" ? Phone : Link2,
      state: toolState(t.state),
      ms: t.time?.durationMs,
    }));
  const report = a.tools.find((t) => t.name === "submitRiskReport");

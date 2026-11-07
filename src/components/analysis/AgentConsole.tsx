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

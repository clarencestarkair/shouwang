"use client";
/**
 * AI 思考过程可视化：多智能体流水线的每一步（隐私保护 → 看图识字 → 规则初筛 → AI 研判
 * → 翻案例 / 查号码 / 查链接 → 安全审查）以步进时间线展示。
 */
import { useState } from "react";
import { Check, ChevronDown, CircleAlert, Minus, Sparkles } from "lucide-react";
import type { GuardianUIMessage, TraceData } from "@/lib/ai/messages";
import { cn } from "@/lib/utils";

type Part = GuardianUIMessage["parts"][number];

interface Step {
  key: string;
  title: string;
  detail?: string;
  status: TraceData["status"];
  tech?: string;
}

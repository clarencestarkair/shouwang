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

const ORDER: Record<string, number> = { privacy: 0, perception: 1, rules: 2, agent: 3, guard: 9 };

function stepsFromParts(parts: Part[]): Step[] {
  const steps: Step[] = [];
  for (const p of parts) {
    if (p.type === "data-trace") {
      const d = p.data;
      steps.push({ key: d.step, title: d.title, detail: d.detail, status: d.status });
    } else if (p.type === "tool-searchFraudCases") {
      const done = p.state === "output-available";
      const out = done ? p.output : undefined;
      steps.push({
        key: `tool-${p.toolCallId}`,
        title: "翻看相似案例",
        status: p.state === "output-error" ? "error" : done ? "done" : "running",
        detail: out ? `找到 ${out.results.length} 条相关案例：${out.results.slice(0, 2).map((r) => r.title).join("；")}` : p.input?.query ? `查找“${p.input.query}”` : "查找中…",
        tech: out ? `hybrid · BM25${out.channels.vector ? " + vector" : ""} · RRF · ${out.results.map((r) => r.id).join(" ")}` : undefined,
      });
    } else if (p.type === "tool-checkPhoneNumber") {
      const out = p.state === "output-available" ? p.output : undefined;
      steps.push({
        key: `tool-${p.toolCallId}`,
        title: `核验号码 ${p.input?.phone ?? ""}`,
        status: out ? "done" : p.state === "output-error" ? "error" : "running",
        detail: out ? `${out.tags.join("、") || "无异常"} · 风险 ${out.riskScore}` : undefined,
        tech: "tool · checkPhoneNumber",
      });
    } else if (p.type === "tool-checkUrl") {
      const out = p.state === "output-available" ? p.output : undefined;
      steps.push({
        key: `tool-${p.toolCallId}`,
        title: `核验链接 ${out?.hostname ?? p.input?.url ?? ""}`,
        status: out ? "done" : p.state === "output-error" ? "error" : "running",
        detail: out ? `${out.tags.join("、")} · 风险 ${out.riskScore}` : undefined,
        tech: "tool · checkUrl",
      });
    }
  }
  const traces = steps.filter((s) => s.key in ORDER).sort((a, b) => ORDER[a.key] - ORDER[b.key]);
  const tools = steps.filter((s) => !(s.key in ORDER));
  const agentIdx = traces.findIndex((s) => s.key === "agent");
  if (agentIdx >= 0) traces.splice(agentIdx + 1, 0, ...tools);
  else traces.push(...tools);
  return traces;
}

export function AgentTrace({ parts, busy }: { parts: Part[]; busy: boolean }) {
  const steps = stepsFromParts(parts);
  const [open, setOpen] = useState<boolean | null>(null);
  const running = busy || steps.some((s) => s.status === "running");
  const expanded = open ?? running;
  const done = steps.filter((s) => s.status === "done").length;
  const progress = steps.length ? done / Math.max(steps.length, 5) : 0;

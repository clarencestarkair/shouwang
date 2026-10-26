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

  return (
    <section aria-label="守望的分析过程" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <button type="button" onClick={() => setOpen(!expanded)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5">
        <span className={cn("relative grid size-7 place-items-center rounded-full", running ? "bg-accent-soft text-accent" : "bg-ok-soft text-ok-ink")}>
          {running && <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-full bg-accent/30" />}
          {running ? <Sparkles className="relative size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] font-semibold text-ink">{running ? "守望正在分析" : "分析完成"}</span>
          <span className="block text-[0.82rem] text-ink-3">{steps.length ? `${done} / ${steps.length} 个步骤` : "正在准备…"}</span>
        </span>
        <ChevronDown className={cn("size-5 text-ink-3 transition-transform duration-300", expanded && "rotate-180")} aria-hidden />
      </button>
      {running && (
        <div className="relative h-0.5 overflow-hidden bg-surface-2">
          <div className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-700" style={{ width: `${Math.max(8, progress * 100)}%` }} />
          <div className="animate-shimmer absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
      )}
      <div className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]" style={{ gridTemplateRows: expanded && steps.length ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <ol className="space-y-0 border-t border-line px-4 py-3 sm:px-5">
            {steps.map((s, i) => (
              <li key={s.key} className="animate-rise relative flex gap-3 py-2">
                {i < steps.length - 1 && <span aria-hidden className="absolute bottom-[-0.5rem] left-[0.6875rem] top-8 w-px bg-line" />}
                <StatusDot status={s.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] font-medium leading-6 text-ink">{s.title}</p>
                  {s.detail && <p className="text-[0.85rem] leading-relaxed text-ink-2">{s.detail}</p>}
                  {s.tech && <p className="mt-0.5 truncate font-mono text-[0.7rem] text-ink-3">{s.tech}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

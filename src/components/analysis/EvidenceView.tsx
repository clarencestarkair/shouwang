"use client";
/**
 * 证据标注：在老人发来的原文（或截图识别出的文字）上直接高亮可疑句，
 * 编号与右侧的理由一一对应；规则引擎命中的片段用虚线下划线标出。
 */
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import type { RiskReport, RiskSignal } from "@/lib/core/types";
import { cn } from "@/lib/utils";

interface Range {
  start: number;
  end: number;
  kind: "reason" | "rule";
  idx: number;
  label: string;
}

/** 在原文中定位证据：先整句匹配，再按省略号拆段匹配 */
function locate(source: string, evidence: string): [number, number][] {
  const clean = evidence.replace(/^[“"「]|[”"」]$/g, "").trim();
  if (!clean || clean === "—") return [];
  const at = source.indexOf(clean);
  if (at >= 0) return [[at, at + clean.length]];
  const out: [number, number][] = [];
  for (const seg of clean.split(/……|\.\.\.|…|，|,|。/).map((x) => x.trim()).filter((x) => x.length >= 4)) {
    const i = source.indexOf(seg);
    if (i >= 0) out.push([i, i + seg.length]);
  }
  return out;
}

export function EvidenceView({ source, report, signals }: { source: string; report: RiskReport; signals: RiskSignal[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const ranges = useMemo(() => {
    const rs: Range[] = [];
    report.reasons.forEach((r, i) => {
      for (const [s, e] of locate(source, r.evidence)) rs.push({ start: s, end: e, kind: "reason", idx: i, label: r.point });
    });
    signals.forEach((sig, i) => {
      for (const [s, e] of locate(source, sig.evidence)) {
        if (!rs.some((x) => x.kind === "reason" && s < x.end && e > x.start)) rs.push({ start: s, end: e, kind: "rule", idx: i, label: sig.label });
      }
    });
    // 去重叠：按起点排序，后者与前者重叠则跳过
    const sorted = rs.sort((a, b) => a.start - b.start || (a.kind === "reason" ? -1 : 1));
    const kept: Range[] = [];
    for (const r of sorted) if (!kept.length || r.start >= kept[kept.length - 1].end) kept.push(r);
    return kept;
  }, [source, report.reasons, signals]);

  if (!source.trim()) return null;

  const pieces: React.ReactNode[] = [];
  let cur = 0;
  ranges.forEach((r, k) => {
    if (r.start > cur) pieces.push(<span key={`t${k}`}>{source.slice(cur, r.start)}</span>);
    const text = source.slice(r.start, r.end);
    pieces.push(
      r.kind === "reason" ? (
        <mark
          key={`m${k}`}
          onMouseEnter={() => setHover(r.idx)}
          onMouseLeave={() => setHover(null)}
          className={cn("rounded-md bg-danger-soft px-0.5 text-ink ring-danger/40 transition-shadow", hover === r.idx && "ring-2")}
        >
          {text}
          <sup className="tnum ml-0.5 rounded-full bg-danger px-1.5 text-[0.65rem] font-bold text-white">{r.idx + 1}</sup>
        </mark>
      ) : (
        <span key={`r${k}`} title={`规则命中：${r.label}`} className="underline decoration-warn decoration-dashed decoration-2 underline-offset-4">
          {text}
        </span>
      ),
    );
    cur = r.end;
  });
  if (cur < source.length) pieces.push(<span key="tail">{source.slice(cur)}</span>);

  return (
    <section aria-label="证据标注" className="animate-rise grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line shadow-sm lg:grid-cols-[1.15fr_1fr]">
      <div className="bg-surface p-6 sm:p-7">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
          <FileText className="size-4" aria-hidden /> 您发来的内容 · 可疑处已标出
        </p>
        <p className="mt-4 whitespace-pre-wrap text-[1.08rem] leading-[2]">{pieces}</p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem] text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-5 rounded bg-danger-soft ring-1 ring-danger/30" /> AI 判断依据
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-5 border-b-2 border-dashed border-warn" /> 规则引擎命中
          </span>
        </p>
      </div>
      <div className="bg-surface p-6 sm:p-7">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink-3">为什么说它有问题</p>
        <ol className="mt-4 space-y-4">
          {report.reasons.map((r, i) => (
            <li key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn("flex gap-3 rounded-xl p-2 transition-colors", hover === i && "bg-danger-soft")}>
              <span className="tnum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-danger text-[0.75rem] font-bold text-white">{i + 1}</span>
              <span className="text-[1.05rem] font-medium leading-relaxed text-ink">{r.point}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

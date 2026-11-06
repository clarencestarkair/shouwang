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

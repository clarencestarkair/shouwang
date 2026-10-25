"use client";
/**
 * 环形风险仪表：270° 圆弧，挂载后由 0 动画到目标分值。
 * 颜色 + 数字 + 等级文字三重编码，不依赖单一颜色传达信息。
 */
import { useEffect, useState } from "react";
import { RISK_LABEL, type RiskLevel } from "@/lib/core/types";

export const LEVEL_COLOR: Record<RiskLevel, string> = {
  critical: "var(--danger)",
  high: "var(--danger)",
  medium: "var(--warn)",
  low: "var(--ok)",
  safe: "var(--ok)",
};

export const LEVEL_SOFT: Record<RiskLevel, string> = {
  critical: "var(--danger-soft)",
  high: "var(--danger-soft)",
  medium: "var(--warn-soft)",
  low: "var(--ok-soft)",
  safe: "var(--ok-soft)",
};

export const LEVEL_INK: Record<RiskLevel, string> = {
  critical: "var(--danger)",
  high: "var(--danger)",
  medium: "var(--warn-ink)",
  low: "var(--ok-ink)",
  safe: "var(--ok-ink)",
};

interface GaugeProps {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  caption?: string;
  label?: string;
  labelColor?: string;
  animate?: boolean;
}

export function Gauge({ value, color, size = 132, stroke = 10, caption, label, labelColor, animate = true }: GaugeProps) {
  const [shown, setShown] = useState(animate ? 0 : value);
  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value, animate]);

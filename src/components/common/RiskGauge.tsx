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

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${caption ?? "分数"} ${value}${label ? `，${label}` : ""}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc * pct} ${c}`}
          style={{ transition: "stroke-dasharray 1100ms var(--ease-out-expo)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="tnum font-semibold leading-none tracking-tight" style={{ fontSize: size * 0.3 }}>
            {Math.round(value)}
          </div>
          {caption && <div className="mt-1 text-ink-3" style={{ fontSize: Math.max(11, size * 0.085) }}>{caption}</div>}
        </div>
      </div>
      {label && (
        <div
          className="absolute inset-x-0 bottom-0 mx-auto w-fit rounded-full px-2.5 py-0.5 font-semibold"
          style={{ fontSize: Math.max(11, size * 0.09), color: labelColor ?? color, background: "var(--surface)" }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export function RiskGauge({ level, score, size = 132, animate = true }: { level: RiskLevel; score: number; size?: number; animate?: boolean }) {
  return <Gauge value={score} color={LEVEL_COLOR[level]} size={size} caption="风险指数" label={RISK_LABEL[level]} labelColor={LEVEL_INK[level]} animate={animate} />;
}

/** 小号等级标签 */
export function LevelChip({ level, className = "" }: { level: RiskLevel; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.8rem] font-semibold ${className}`} style={{ background: LEVEL_SOFT[level], color: LEVEL_INK[level] }}>
      <span className="size-1.5 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
      {RISK_LABEL[level]}
    </span>
  );
}

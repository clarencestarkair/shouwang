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

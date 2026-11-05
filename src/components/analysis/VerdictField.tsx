"use client";
/**
 * 整屏结论（方向 A · 信号）：识破骗局的那一刻，整块区域变成警示红、提醒橙或安心绿，
 * 只用 2~4 个大字说清楚“现在该怎么做”。颜色 + 大字 + 分数三重编码。
 */
import { useEffect, useRef } from "react";
import { BellRing, Phone, Volume2 } from "lucide-react";
import { Gauge } from "@/components/common/RiskGauge";
import { FRAUD_TYPES, RISK_LABEL, levelRank, type RiskReport } from "@/lib/core/types";
import { speak } from "@/lib/client/speech";
import { useSettings } from "@/lib/stores/settings";

const FIELD = {
  danger: { bg: "radial-gradient(120% 90% at 15% 0%, oklch(0.74 0.19 40) 0%, oklch(0.63 0.22 30) 45%, oklch(0.52 0.2 27) 100%)", deep: "oklch(0.46 0.18 27)" },
  warn: { bg: "radial-gradient(120% 90% at 15% 0%, oklch(0.85 0.15 80) 0%, oklch(0.75 0.17 60) 50%, oklch(0.66 0.17 48) 100%)", deep: "oklch(0.5 0.13 50)" },
  ok: { bg: "radial-gradient(120% 90% at 15% 0%, oklch(0.68 0.14 160) 0%, oklch(0.53 0.12 158) 55%, oklch(0.42 0.1 158) 100%)", deep: "oklch(0.36 0.09 158)" },
};

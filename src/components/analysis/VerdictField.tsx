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

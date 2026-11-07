"use client";
/** 手机预览：指挥台左侧展示“老人此刻在手机上看到什么”（方向 A 整屏色场的缩略版） */
import { Loader2 } from "lucide-react";
import { levelRank, RISK_LABEL } from "@/lib/core/types";
import type { Analysis } from "./derive";

const BG = {
  danger: "radial-gradient(120% 80% at 20% 0%, oklch(0.74 0.19 40), oklch(0.6 0.22 29) 50%, oklch(0.5 0.2 27))",
  warn: "radial-gradient(120% 80% at 20% 0%, oklch(0.85 0.15 80), oklch(0.74 0.17 58) 55%, oklch(0.64 0.17 48))",
  ok: "radial-gradient(120% 80% at 20% 0%, oklch(0.68 0.14 160), oklch(0.52 0.12 158) 55%, oklch(0.42 0.1 158))",
};

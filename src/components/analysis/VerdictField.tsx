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

export function VerdictField({ report, notified, fallback }: { report: RiskReport; notified: boolean; fallback?: boolean }) {
  const { autoSpeak, familyPhone } = useSettings();
  const rank = levelRank(report.level);
  const f = rank >= 3 ? FIELD.danger : rank === 2 ? FIELD.warn : FIELD.ok;
  const big = report.shortVerdict || (rank >= 3 ? "别转钱" : rank === 2 ? "先别信" : "放心");
  const typeLabel = report.fraudType !== "none" && report.fraudType !== "unknown" ? FRAUD_TYPES[report.fraudType] : null;
  const speech = `${big}。${report.headline}。${report.reasons.map((r) => r.point).join("。")}。您现在要做的是：${report.actions.join("。")}`;
  const spoken = useRef(false);

  useEffect(() => {
    if (autoSpeak && !spoken.current) {
      spoken.current = true;
      const t = setTimeout(() => speak(speech), 700);
      return () => clearTimeout(t);
    }
  }, [autoSpeak, speech]);

  return (
    <article aria-label="风险判断结果" className="animate-rise relative overflow-hidden rounded-[2rem] text-white shadow-lg" style={{ background: f.bg }}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
      <div className="relative grid gap-8 p-7 sm:grid-cols-[1fr_auto] sm:p-9">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[0.85rem] font-semibold tracking-wide text-white/85">
            <span>守望 · {RISK_LABEL[report.level]}</span>
            {typeLabel && <span className="rounded-full bg-white/18 px-2.5 py-0.5 font-medium">{typeLabel}</span>}
            {fallback && <span className="rounded-full bg-black/20 px-2.5 py-0.5 font-medium">离线兜底</span>}
          </p>
          <h3 className="mt-4 text-[4.2rem] font-black leading-[0.95] tracking-[-0.04em] sm:text-[5.6rem]">{big}</h3>
          <p className="mt-4 max-w-[28rem] text-[1.25rem] font-semibold leading-snug text-white/95">{report.headline}</p>
        </div>
        <div className="flex items-start sm:justify-end">
          <div className="rounded-full bg-white/12 p-2 backdrop-blur-sm">
            <Gauge value={report.score} color="white" size={128} stroke={9} caption="风险指数" animate />
          </div>
        </div>
      </div>

      {report.actions.length > 0 && (
        <ol className="relative mx-5 grid gap-2 sm:mx-7 sm:grid-cols-3">
          {report.actions.slice(0, 3).map((a, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white/14 p-3.5 text-[1rem] font-medium leading-snug backdrop-blur-sm">
              <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-white text-[0.8rem] font-bold" style={{ color: f.deep }}>
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>
      )}

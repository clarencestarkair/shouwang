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

export function PhonePreview({ a, idle }: { a: Analysis | null; idle?: boolean }) {
  const r = a?.report;
  const rank = r ? levelRank(r.level) : 0;
  const bg = !r ? "var(--surface)" : rank >= 3 ? BG.danger : rank === 2 ? BG.warn : BG.ok;
  return (
    <div className="mx-auto w-[280px] shrink-0 rounded-[46px] bg-[#0b0c0e] p-[9px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8),inset_0_0_0_1.5px_#2c2e33]">
      <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[38px] transition-[background] duration-700" style={{ background: bg }}>
        <span className="absolute left-1/2 top-[16px] z-10 h-6 w-[84px] -translate-x-1/2 rounded-full bg-[#0b0c0e]" />
        <div className="flex justify-between px-6 pt-4 font-mono text-[11px] font-semibold" style={{ color: r ? "white" : "var(--ink)" }}>
          <span>9:41</span>
          <span>5G</span>
        </div>
        {r ? (
          <div className="animate-rise flex flex-1 flex-col p-5 text-white">
            <p className="flex justify-between text-[10.5px] font-semibold tracking-wide text-white/85">
              <span>守望 · {RISK_LABEL[r.level]}</span>
              <span className="tnum">{r.score}</span>
            </p>
            <p className="mt-5 text-[52px] font-black leading-none tracking-[-0.04em]">{r.shortVerdict || (rank >= 3 ? "别转钱" : rank === 2 ? "先别信" : "放心")}</p>
            <p className="mt-3 text-[14px] font-semibold leading-snug">{r.headline}</p>
            <div className="mt-auto space-y-1.5">
              {r.reasons.slice(0, 2).map((x, i) => (
                <p key={i} className="rounded-xl bg-white/16 px-3 py-2 text-[11.5px] leading-snug backdrop-blur-sm">
                  {x.point}
                </p>
              ))}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <span className="rounded-xl bg-white py-2.5 text-center text-[12px] font-bold" style={{ color: rank >= 3 ? "oklch(0.5 0.2 27)" : rank === 2 ? "oklch(0.5 0.13 50)" : "oklch(0.38 0.09 158)" }}>
                  {rank >= 2 ? "打给孩子" : "知道了"}
                </span>
                <span className="rounded-xl bg-black/20 py-2.5 text-center text-[12px] font-semibold">读给我听</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            {idle ? (
              <>
                <p className="text-[22px] font-black tracking-tight text-ink">拿不准的消息，<br />发给我看看</p>
                <p className="text-[12px] text-ink-3">在右侧选择一个场景开始</p>
              </>
            ) : (
              <>
                <Loader2 className="size-7 animate-spin text-accent" />
                <p className="text-[15px] font-semibold text-ink">守望正在帮您看…</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

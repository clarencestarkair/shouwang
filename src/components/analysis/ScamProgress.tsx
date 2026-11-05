"use client";
/**
 * 骗局进度条：把所有诈骗共有的四步剧本摆出来，标出骗子已经走到哪一步，
 * 并预判他下一步会让老人做什么——让老人提前识破，而不是事后才知道。
 */
import { ArrowRight, Check, Eye } from "lucide-react";
import { SCAM_STAGES } from "@/lib/core/types";
import { cn } from "@/lib/utils";

export function ScamProgress({ stage, nextMove }: { stage: number; nextMove?: string }) {
  if (!stage) return null;
  return (
    <section aria-label="骗局进行到哪一步" className="animate-rise rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-[1.2rem] font-semibold tracking-tight">骗子的剧本，已经走到第 {stage} 步</h4>
        <p className="text-[0.85rem] text-ink-3">所有电信诈骗都绕不开这四步</p>
      </div>
      <ol className="mt-6 grid gap-2 sm:grid-cols-4 sm:gap-0">
        {SCAM_STAGES.map((s, i) => {
          const done = s.n < stage;
          const now = s.n === stage;
          const future = s.n > stage;
          return (
            <li key={s.n} className="relative flex gap-3 sm:block sm:pr-4">
              {i < SCAM_STAGES.length - 1 && (
                <span aria-hidden className={cn("absolute left-[0.95rem] top-9 h-[calc(100%-1.5rem)] w-0.5 sm:left-9 sm:right-0 sm:top-[0.95rem] sm:h-0.5 sm:w-auto", s.n < stage ? "bg-danger" : "bg-surface-3")} />
              )}
              <span
                className={cn(
                  "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[0.85rem] font-bold",
                  done && "bg-danger text-white",
                  now && "bg-danger text-white ring-4 ring-danger-soft",
                  future && "bg-surface-2 text-ink-3",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : s.n}
              </span>
              <div className="pb-3 sm:mt-3 sm:pb-0">
                <p className={cn("text-[1rem] font-semibold", future ? "text-ink-3" : "text-ink")}>
                  {s.title}
                  {now && <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-danger-soft px-2 py-0.5 align-middle text-[0.72rem] font-bold text-danger">现在</span>}
                </p>
                <p className="mt-0.5 text-[0.85rem] leading-relaxed text-ink-3">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {nextMove && stage < 4 && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-warn-soft p-4">
          <Eye className="mt-0.5 size-5 shrink-0 text-warn-ink" aria-hidden />
          <p className="text-[1rem] leading-relaxed text-ink">
            <span className="font-semibold text-warn-ink">守望预判：</span>
            {nextMove}
            <ArrowRight className="mx-1 inline size-4 text-ink-3" aria-hidden />
            <span className="font-semibold">到那一步，千万别照做。</span>
          </p>
        </div>
      )}
    </section>
  );
}

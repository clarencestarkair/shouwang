"use client";
import { useSettings } from "@/lib/stores/settings";
import { cn } from "@/lib/utils";

/** 长辈端设置：称呼、家人电话、自动朗读、字号（就地展开，不用弹窗） */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  return (
    <section aria-label="设置" className="animate-rise mt-5 grid gap-5 rounded-2xl border border-line bg-surface p-5 shadow-md sm:grid-cols-2 sm:p-6">
      <label className="block">
        <span className="text-[0.85rem] font-medium text-ink-2">怎么称呼您</span>
        <input
          value={s.elderName}
          maxLength={8}
          onChange={(e) => s.set({ elderName: e.target.value })}
          className="mt-1.5 h-12 w-full rounded-xl border border-line-2 bg-surface px-4 text-[1.05rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </label>
      <label className="block">
        <span className="text-[0.85rem] font-medium text-ink-2">孩子的电话（一键拨打）</span>
        <input
          value={s.familyPhone}
          inputMode="tel"
          onChange={(e) => s.set({ familyPhone: e.target.value.replace(/[^\d+]/g, "") })}
          placeholder="选填"
          className="mt-1.5 h-12 w-full rounded-xl border border-line-2 bg-surface px-4 text-[1.05rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
      </label>
      <fieldset>
        <legend className="text-[0.85rem] font-medium text-ink-2">字的大小</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {([1, 2, 3] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => s.set({ fontLevel: lv })}
              aria-pressed={s.fontLevel === lv}
              className={cn("h-11 rounded-lg font-medium transition-all", s.fontLevel === lv ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink")}
              style={{ fontSize: [0, 15, 18, 22][lv] }}
            >
              {["", "标准", "大", "特大"][lv]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex items-end justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-3 text-[1rem] text-ink">
          <span className={cn("relative h-7 w-12 rounded-full transition-colors", s.autoSpeak ? "bg-ok" : "bg-surface-3")}>
            <input type="checkbox" checked={s.autoSpeak} onChange={(e) => s.set({ autoSpeak: e.target.checked })} className="peer sr-only" />
            <span className={cn("absolute top-0.5 size-6 rounded-full bg-surface shadow transition-transform", s.autoSpeak ? "translate-x-[1.375rem]" : "translate-x-0.5")} />
          </span>
          看完自动读给我听
        </label>
        <button type="button" onClick={onClose} className="h-11 rounded-full bg-ink px-5 font-medium text-surface">
          完成
        </button>
      </div>
    </section>
  );
}

/**
 * 首屏产品图：用真实界面拼成的“产品合影”——
 * 浏览器里是 AI 指挥台，前面是老人手机上的整屏警示，右上角是子女收到的通知。
 * 所有数字取自一次真实运行（传单图片，端到端 50.7 s）。
 */
import { Bell, Brain, Check, Database, Eye, Lock, ScanText, ShieldCheck } from "lucide-react";

const BARS: [string, number, number, string][] = [
  ["感知 Agent", 0, 29, "var(--accent)"],
  ["规则引擎", 29, 30, "var(--warn)"],
  ["研判 Agent", 30, 84, "var(--danger)"],
  ["↳ 案例检索", 52, 63, "var(--ok)"],
  ["↳ 链接核验", 52, 53, "var(--ok)"],
  ["口语总结", 84, 100, "var(--ink-3)"],
];

export function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem] pb-10 pt-6" aria-hidden>
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.21_30/0.35),transparent)] blur-2xl" />

      {/* 浏览器：AI 指挥台 */}
      <div className="relative ml-auto w-[88%] overflow-hidden rounded-2xl border border-line-2 bg-[oklch(0.16_0.008_265)] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-surface-2 px-3 py-1 font-mono text-[10.5px] text-ink-3">shouwang.app/console</span>
        </div>
        <div className="space-y-4 p-4 pl-[34%]">
          <div className="flex items-center justify-between font-mono text-[10px] text-ink-3">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="size-1.5 rounded-full bg-ok" /> Agent 指挥台
            </span>
            <span>50.7s · 21.3k tokens</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {NODES.map(([I, l], i) => (
              <span key={l} className="flex items-center gap-1">
                <span className="flex items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-1 text-[10px] text-ink-2">
                  <I className="size-3" />
                  {l}
                </span>
                {i < NODES.length - 1 && <span className="h-px w-1.5 bg-line-2" />}
              </span>
            ))}
          </div>
          <div className="space-y-1.5">
            {BARS.map(([l, a, b, c]) => (
              <div key={l} className="grid grid-cols-[4.6rem_1fr] items-center gap-2 text-[9.5px] text-ink-3">
                <span className="truncate">{l}</span>
                <span className="relative h-1.5 rounded-full bg-surface-2">
                  <span className="absolute inset-y-0 rounded-full" style={{ left: `${a}%`, width: `${Math.max(1.5, b - a)}%`, background: c }} />
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface/60 p-2.5">
              <p className="text-[9.5px] text-ink-3">规则 / 最终</p>
              <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">
                87 <span className="text-ink-3">/</span> <span className="text-danger">90</span>
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface/60 p-2.5">
              <p className="text-[9.5px] text-ink-3">链接核验</p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-ink">ylbt-gov-cn.top · 75</p>
            </div>
          </div>
        </div>
      </div>

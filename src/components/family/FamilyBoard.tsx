"use client";
/**
 * 子女端守护看板：
 * - SSE 实时接收长辈端检测结果，高风险时声音 + 浮层提醒
 * - 本周概览、七日风险分布、诈骗类型分布
 * - 每条预警附带“怎么和爸妈说”的沟通建议（不责备、先共情）
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Check, Copy, MessageCircleHeart, RotateCcw, Sparkles, X } from "lucide-react";
import { ChannelDonut, HourHeatmap, TrendChart, TypeRadar } from "./charts";
import { LEVEL_COLOR, LevelChip, RiskGauge } from "@/components/common/RiskGauge";
import { RISK_LABEL, levelRank, type FamilyAlert, type RiskLevel } from "@/lib/core/types";
import { cn, relativeTime } from "@/lib/utils";

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.22].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
  } catch {
    // 浏览器未允许自动播放时静默
  }
}

const isRisky = (l: RiskLevel) => levelRank(l) >= 3;

export function FamilyBoard() {
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [incoming, setIncoming] = useState<FamilyAlert | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/alerts", { cache: "no-store" });
    const data = (await res.json()) as { alerts: FamilyAlert[] };
    setAlerts(data.alerts);
    setSelected((cur) => cur ?? data.alerts.find((a) => isRisky(a.level))?.id ?? data.alerts[0]?.id ?? null);
  }, []);

  useEffect(() => {
    load();
    const es = new EventSource("/api/alerts/stream");
    es.addEventListener("ready", () => setLive(true));
    es.addEventListener("alert", (e) => {
      const a = JSON.parse((e as MessageEvent).data) as FamilyAlert;
      setAlerts((prev) => [a, ...prev.filter((x) => x.id !== a.id)]);
      if (isRisky(a.level)) {
        setIncoming(a);
        setSelected(a.id);
        beep();
      }
    });
    es.addEventListener("update", (e) => {
      const a = JSON.parse((e as MessageEvent).data) as FamilyAlert;
      setAlerts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    });
    es.addEventListener("reset", () => load());
    es.onerror = () => setLive(false);
    const t = setInterval(() => setNow(Date.now()), 30e3);
    return () => {
      es.close();
      clearInterval(t);
    };
  }, [load]);

  const setStatus = async (id: string, status: FamilyAlert["status"]) => {
    setAlerts((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch("/api/alerts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  // 家人按记录数排序，记录最多的排在前面
  const elders = useMemo(() => {
    const n = new Map<string, number>();
    for (const a of alerts) n.set(a.elderName, (n.get(a.elderName) ?? 0) + 1);
    return [...n.entries()].sort((x, y) => y[1] - x[1]).map(([e]) => e);
  }, [alerts]);
  const [elderSel, setElderSel] = useState<string>("全部");
  const scoped = elderSel === "全部" ? alerts : alerts.filter((a) => a.elderName === elderSel);
  const current = alerts.find((a) => a.id === selected) ?? null;
  const k = useMemo(() => kpis(scoped, now), [scoped, now]);
  const hasDemo = alerts.some((a) => a.demo);
  const digestElder = elderSel === "全部" ? elders[0] : elderSel;

  return (
    <div className="relative mx-auto max-w-[90rem] px-4 pb-20 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute left-1/3 top-0 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.6_0.2_30/0.18),transparent)]" />
      {incoming && (
        <div role="alert" className="animate-rise fixed right-4 top-20 z-40 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-lg sm:right-6">
          <div className="h-1 bg-danger" />
          <div className="flex gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
              <BellRing className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-danger">
                {incoming.elderName}刚刚遇到{RISK_LABEL[incoming.level]}
              </p>
              <p className="mt-0.5 font-medium leading-snug text-ink">{incoming.headline}</p>
              <p className="mt-1 text-xs text-ink-3">刚刚 · 已为你准备好沟通建议</p>
            </div>
            <button type="button" onClick={() => setIncoming(null)} aria-label="关闭提醒" className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="grid gap-4">
          <Card title="风险趋势" meta="近 14 天 · 每日最高风险指数与检测条数">
            <TrendChart alerts={scoped} now={now} onPick={setSelected} />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="骗局类型" meta="需警惕及以上">
              <TypeRadar alerts={scoped} />
            </Card>
            <Card title="来源渠道" meta="需警惕及以上">
              <div className="flex h-full items-center">
                <ChannelDonut alerts={scoped} />
              </div>
            </Card>
          </div>
          <Card title="高发时段" meta="星期 × 24 小时 · 颜色为该时段最高风险">
            <HourHeatmap alerts={scoped} />
          </Card>
          {digestElder && <DigestCard elderName={digestElder} version={alerts.length} />}
        </div>

        <aside className="grid content-start gap-4 xl:sticky xl:top-24 xl:self-start">
          <Card title="守护记录" meta={`${scoped.length} 条`}>
            <ul className="-mx-2 max-h-[19rem] space-y-1 overflow-y-auto pr-1">
              {scoped.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(a.id);
                      if (a.status === "new") setStatus(a.id, "read");
                    }}
                    aria-current={a.id === selected}
                    className={cn("flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors", a.id === selected ? "bg-surface-3" : "hover:bg-surface-2")}
                  >
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: LEVEL_COLOR[a.level] }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13.5px]", a.status === "new" ? "font-semibold text-ink" : "text-ink-2")}>{a.headline}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-3">
                        {a.elderName} · {a.channel ?? "其他"} · {relativeTime(a.createdAt, now)}
                      </span>
                    </span>
                    <span className="tnum font-mono text-[11px]" style={{ color: LEVEL_COLOR[a.level] }}>
                      {a.score}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {current && (
            <AlertDetail
              key={current.id}
              alert={current}
              copied={copied}
              onCopy={() => {
                navigator.clipboard?.writeText(current.familyAdvice ?? "").catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              onStatus={setStatus}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function Card({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-[1.5rem] p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {meta && <span className="text-[12px] text-ink-3">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

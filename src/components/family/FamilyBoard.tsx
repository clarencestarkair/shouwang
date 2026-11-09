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

      <header className="relative flex flex-wrap items-end justify-between gap-5 pb-8 pt-10">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-ink-3">
            <span className="relative flex size-2">
              {live && <span className="animate-pulse-ring absolute inset-0 rounded-full bg-ok" />}
              <span className={cn("relative size-2 rounded-full", live ? "bg-ok" : "bg-ink-3")} />
            </span>
            {live ? "实时守护中" : "正在重新连接…"}
            {hasDemo && <span className="rounded-full border border-line-2 px-2 py-0.5 text-[11px] text-ink-3">含演示数据</span>}
          </p>
          <h1 className="mt-2 text-[2.2rem] font-semibold tracking-tight sm:text-[2.8rem]">家庭守护中心</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass flex rounded-full p-1" role="tablist" aria-label="选择家人">
            {["全部", ...elders].map((e) => (
              <button
                key={e}
                type="button"
                role="tab"
                aria-selected={elderSel === e}
                onClick={() => setElderSel(e)}
                className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", elderSel === e ? "bg-ink text-bg" : "text-ink-2 hover:text-ink")}
              >
                {e}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => fetch("/api/alerts", { method: "DELETE" })} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-3 hover:text-ink">
            <RotateCcw className="size-3.5" aria-hidden /> 重置演示
          </button>
        </div>
      </header>

      {/* KPI */}
      <section className="relative grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="本周检测" value={k.total} unit="条消息" delta={k.total - k.prevTotal} />
        <Stat label="拦下骗局" value={k.blocked} unit="次高风险" tone="danger" delta={k.blocked - k.prevBlocked} />
        <Stat label="平均风险指数" value={k.avg} unit="高风险消息平均" tone="warn" />
        <Stat label="待沟通" value={k.pending} unit={k.pending ? "条需要关心" : "全部处理完"} tone={k.pending ? "danger" : "ok"} />
      </section>

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

function DigestCard({ elderName, version }: { elderName: string; version: number }) {
  const [d, setD] = useState<{ summary: string; suggestions: string[]; generatedBy: string } | null>(null);
  useEffect(() => {
    let alive = true;
    setD(null);
    fetch("/api/digest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderName }) })
      .then((r) => r.json())
      .then((j) => alive && setD(j.digest))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [elderName, version]);
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-accent/30 bg-[linear-gradient(135deg,oklch(0.7_0.15_258/0.16),transparent_60%)] p-6">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
        <Sparkles className="size-4" aria-hidden /> {elderName}的守护周报
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px]">{d ? (d.generatedBy === "ai" ? "AI 生成" : "模板生成") : "生成中…"}</span>
      </p>
      {d ? (
        <>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-ink">{d.summary}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {d.suggestions.map((x, i) => (
              <li key={i} className="flex gap-2.5 rounded-xl bg-surface-2/70 p-3 text-[13.5px] leading-relaxed text-ink-2">
                <span className="tnum mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-bg">{i + 1}</span>
                {x}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-11/12 animate-pulse rounded bg-surface-3" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-3" />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, unit, tone, delta }: { label: string; value: number; unit: string; tone?: "danger" | "warn" | "ok"; delta?: number }) {
  const color = tone === "danger" ? "var(--danger)" : tone === "warn" ? "var(--warn-ink)" : tone === "ok" ? "var(--ok-ink)" : "var(--ink)";
  return (
    <div className="glass rounded-[1.5rem] p-5">
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <p className="tnum mt-3 text-[2.6rem] font-semibold leading-none tracking-tight" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-ink-3">
        {unit}
        {delta !== undefined && delta !== 0 && (
          <span className="tnum rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2">
            {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} 较上周
          </span>
        )}
      </p>
    </div>
  );
}

function AlertDetail({ alert, onStatus, onCopy, copied }: { alert: FamilyAlert; onStatus: (id: string, s: FamilyAlert["status"]) => void; onCopy: () => void; copied: boolean }) {
  return (
    <article className="animate-rise overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-md">
      <div className="flex items-center gap-5 border-b border-line p-6">
        <RiskGauge level={alert.level} score={alert.score ?? 0} size={104} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LevelChip level={alert.level} />
            <span className="tnum text-xs text-ink-3">{new Date(alert.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <h3 className="mt-2 text-[1.45rem] font-semibold leading-snug tracking-tight">{alert.headline}</h3>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{alert.elderName}收到的内容 · 已隐去敏感信息</p>
          <p className="mt-2 rounded-xl bg-surface-2 px-4 py-3 text-[0.92rem] leading-relaxed text-ink-2">{alert.contentPreview}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">判断依据</p>
          <ul className="mt-2 space-y-2.5">
            {alert.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3" />
                <span>
                  {r.point}
                  {r.evidence && r.evidence !== "—" && <span className="text-ink-3"> ——“{r.evidence}”</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {alert.familyAdvice && (
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent">
              <MessageCircleHeart className="size-4" aria-hidden /> 怎么跟{alert.elderName}说
            </p>
            <p className="mt-1.5 leading-relaxed text-ink">{alert.familyAdvice}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {alert.familyAdvice && (
            <button type="button" onClick={onCopy} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-surface">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "已复制" : "复制沟通建议"}
            </button>
          )}
          {alert.status !== "handled" ? (
            <button type="button" onClick={() => onStatus(alert.id, "handled")} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-2 bg-surface px-4 text-sm font-medium">
              <Check className="size-4" aria-hidden /> 标记为已沟通
            </button>
          ) : (
            <span className="inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-ok-ink">
              <Check className="size-4" aria-hidden /> 已沟通处理
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function kpis(alerts: FamilyAlert[], now: number) {
  const week = now - 7 * 86400e3;
  const prev = now - 14 * 86400e3;
  const cur = alerts.filter((a) => a.createdAt >= week);
  const last = alerts.filter((a) => a.createdAt >= prev && a.createdAt < week);
  const risky = cur.filter((a) => isRisky(a.level));
  return {
    total: cur.length,
    prevTotal: last.length,
    blocked: risky.length,
    prevBlocked: last.filter((a) => isRisky(a.level)).length,
    avg: risky.length ? Math.round(risky.reduce((s, a) => s + (a.score ?? 0), 0) / risky.length) : 0,
    pending: alerts.filter((a) => isRisky(a.level) && a.status !== "handled").length,
  };
}

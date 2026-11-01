"use client";
/**
 * 案例库：既是给家属/老人看的反诈课堂，也是 RAG 知识库的可视化窗口——
 * 搜索时展示每条结果由“关键词”还是“语义”通道命中，让检索过程可解释。
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, Lightbulb, Loader2, Search } from "lucide-react";
import { FRAUD_TYPES, type FraudCase, type FraudType, type RetrievedDoc } from "@/lib/core/types";
import { cn } from "@/lib/utils";

const LOSS = { high: "损失大", medium: "损失中等", low: "损失较小" } as const;

function Channels({ by }: { by: RetrievedDoc["matchedBy"] }) {
  return (
    <span className="inline-flex gap-1">
      {by.map((m) => (
        <span key={m} className={cn("rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase", m === "bm25" ? "bg-surface-3 text-ink-2" : "bg-accent-soft text-accent")}>
          {m === "bm25" ? "keyword" : "semantic"}
        </span>
      ))}
    </span>
  );
}

export function CasesExplorer({ cases }: { cases: FraudCase[] }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim());
  const [type, setType] = useState<FraudType | "all">("all");
  const [hits, setHits] = useState<RetrievedDoc[] | null>(null);
  const [channels, setChannels] = useState<{ bm25: boolean; vector: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(cases[0]?.id ?? null);

  useEffect(() => {
    if (query.length < 2) {
      setHits(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cases?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const data = await res.json();
        setHits(data.docs);
        setChannels(data.channels);
      } catch {
        /* 被新的输入中断 */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const byId = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);
  const list: { c: FraudCase; hit?: RetrievedDoc }[] = hits
    ? hits.filter((h) => h.kind === "case").flatMap((h) => (byId.get(h.id) ? [{ c: byId.get(h.id)!, hit: h }] : []))
    : cases.filter((c) => type === "all" || c.type === type).map((c) => ({ c }));
  const knowledgeHits = hits?.filter((h) => h.kind === "knowledge") ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-ink-3">
          案例库 · <span className="tnum">{cases.length}</span> 个典型骗局
        </p>
        <h1 className="mt-2 text-[2.3rem] font-semibold tracking-tight sm:text-[2.8rem]">骗子的套路，都在这里</h1>
      </div>

      <label className="relative mx-auto mt-8 block max-w-2xl">
        <span className="sr-only">搜索案例</span>
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="用自己的话描述，比如“有人说我孙子出事了要钱”"
          className="h-14 w-full rounded-2xl border border-line-2 bg-surface pl-13 pr-12 text-[1.02rem] shadow-md outline-none transition-shadow focus:border-accent focus:ring-4 focus:ring-accent-soft"
        />
        {loading && <Loader2 className="absolute right-5 top-1/2 size-5 -translate-y-1/2 animate-spin text-ink-3" />}
      </label>
      <p className="mt-3 h-4 text-center text-xs text-ink-3">
        {hits && channels ? `混合检索 · BM25 ${channels.vector ? "+ 语义向量" : "（语义向量未启用）"} · RRF 融合排序` : ""}
      </p>

      {!hits && (
        <div className="mt-6 flex flex-wrap justify-center gap-1.5" role="group" aria-label="按类型筛选">
          {(["all", ...Object.keys(FRAUD_TYPES)] as (FraudType | "all")[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              aria-pressed={type === t}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors", type === t ? "bg-ink text-surface" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink")}
            >
              {t === "all" ? "全部" : FRAUD_TYPES[t]}
            </button>
          ))}
        </div>
      )}

      {knowledgeHits.length > 0 && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {knowledgeHits.slice(0, 2).map((k) => (
            <div key={k.id} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <p className="flex items-center justify-between gap-2 text-xs font-semibold text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb className="size-3.5 text-warn" aria-hidden /> 反诈常识
                </span>
                <Channels by={k.matchedBy} />
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">{k.snippet.replace(/^【[^】]+】/, "")}</p>
            </div>
          ))}
        </section>
      )}

      <ul className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {list.map(({ c, hit }, i) => {
          const expanded = open === c.id;
          return (
            <li key={c.id} className={cn(i > 0 && "border-t border-line")}>
              <button type="button" onClick={() => setOpen(expanded ? null : c.id)} aria-expanded={expanded} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/60">
                <span className="hidden w-16 shrink-0 font-mono text-xs text-ink-3 sm:block">{c.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug text-ink">{c.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-3">
                    {FRAUD_TYPES[c.type]} · {c.channels.join(" / ")}
                  </span>
                </span>
                {hit && (
                  <span className="hidden items-center gap-2 sm:flex">
                    <Channels by={hit.matchedBy} />
                    <span className="tnum font-mono text-xs text-ink-3">{hit.score.toFixed(3)}</span>
                  </span>
                )}
                <ChevronDown className={cn("size-4 shrink-0 text-ink-3 transition-transform duration-300", expanded && "rotate-180")} aria-hidden />
              </button>
              <div className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <div className="grid gap-6 px-5 pb-6 sm:pl-25 md:grid-cols-[1.3fr_1fr]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">骗子会这么说</p>
                      <blockquote className="mt-2 rounded-xl bg-surface-2 p-4 text-[0.98rem] leading-[1.85] text-ink">“{c.script}”</blockquote>
                      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">他们是怎么做的</p>
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{c.process}</p>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-danger">识破它</p>
                        <ul className="mt-2 space-y-2 text-[0.95rem] leading-relaxed">
                          {c.redFlags.map((r) => (
                            <li key={r} className="flex gap-2">
                              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-danger" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ok-ink">防住它</p>
                        <ul className="mt-2 space-y-2 text-[0.95rem] leading-relaxed">
                          {c.advice.map((r) => (
                            <li key={r} className="flex gap-2">
                              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ok" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-ink-3">
                        常见对象：{c.targetGroup} · {LOSS[c.lossLevel]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

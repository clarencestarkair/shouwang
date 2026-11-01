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

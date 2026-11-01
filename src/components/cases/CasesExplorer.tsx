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

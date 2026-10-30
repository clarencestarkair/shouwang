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

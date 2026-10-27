"use client";
/**
 * 子女端图表（手写 SVG，无第三方图表库）：
 * - TrendChart：近 14 天每日最高风险指数（面积线）+ 每日检测条数（柱）+ 风险阈值线
 * - TypeRadar：骗局类型雷达
 * - HourHeatmap：星期 × 24 小时的风险热力
 * - ChannelDonut：信息来源渠道分布
 */
import { LEVEL_COLOR } from "@/components/common/RiskGauge";
import { levelRank, scoreToLevel, type Channel, type FamilyAlert, type FraudType } from "@/lib/core/types";

const DAY = 86400e3;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/* ———————————— 趋势 ———————————— */
export function TrendChart({ alerts, now, onPick }: { alerts: FamilyAlert[]; now: number; onPick?: (id: string) => void }) {
  const W = 720;
  const H = 230;
  const P = { l: 34, r: 64, t: 16, b: 30 };
  const today = startOfDay(now);
  const days = Array.from({ length: 14 }, (_, i) => {
    const from = today - (13 - i) * DAY;
    const items = alerts.filter((a) => a.createdAt >= from && a.createdAt < from + DAY);
    const top = items.reduce<FamilyAlert | null>((m, a) => (!m || a.score > m.score ? a : m), null);
    return { from, items, top };
  });
  const maxCount = Math.max(1, ...days.map((d) => d.items.length));
  const x = (i: number) => P.l + (i / 13) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / 100) * (H - P.t - P.b);
  // 没有记录的日子不画点、不拉到 0，折线只连接有数据的日子
  const pts = days.map((d, i) => [x(i), y(d.top?.score ?? 0)] as const);
  const has = days.map((d, i) => (d.top ? i : -1)).filter((i) => i >= 0);
  const line = has.map((i, k) => `${k ? "L" : "M"}${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`).join(" ");
  const area = has.length ? `${line} L${x(has[has.length - 1])},${y(0)} L${x(has[0])},${y(0)} Z` : "";

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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="近 14 天每日最高风险指数与检测条数">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 阈值线 */}
      {[
        { v: 65, label: "高风险", c: "var(--danger)" },
        { v: 40, label: "需警惕", c: "var(--warn)" },
      ].map((t) => (
        <g key={t.v}>
          <line x1={P.l} x2={W - P.r} y1={y(t.v)} y2={y(t.v)} stroke={t.c} strokeOpacity="0.45" strokeDasharray="4 5" />
          <text x={W - P.r + 8} y={y(t.v) + 4} fontSize="11" fill={t.c}>
            {t.label} {t.v}
          </text>
        </g>
      ))}
      {[0, 50, 100].map((v) => (
        <text key={v} x={P.l - 8} y={y(v) + 4} fontSize="10" textAnchor="end" fill="var(--ink-3)">
          {v}
        </text>
      ))}
      {/* 每日条数柱 */}
      {days.map((d, i) => {
        const h = (d.items.length / maxCount) * 46;
        return <rect key={`b${i}`} x={x(i) - 7} y={y(0) - h} width="14" height={h} rx="3" fill="var(--ink)" fillOpacity="0.08" />;
      })}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke="var(--danger)" strokeWidth="2.2" strokeLinejoin="round" />
      {days.map((d, i) =>
        d.top ? (
          <circle
            key={`p${i}`}
            cx={pts[i][0]}
            cy={pts[i][1]}
            r={i === 13 ? 6 : 4.5}
            fill={LEVEL_COLOR[d.top.level]}
            stroke="var(--bg)"
            strokeWidth="2"
            className="cursor-pointer"
            onClick={() => d.top && onPick?.(d.top.id)}
          >
            <title>{`${new Date(d.from).getMonth() + 1}/${new Date(d.from).getDate()} 最高 ${d.top.score} · ${d.items.length} 条`}</title>
          </circle>
        ) : null,
      )}
      {days.map((d, i) =>
        i % 2 === 1 || i === 13 ? (
          <text key={`x${i}`} x={x(i)} y={H - 8} fontSize="10.5" textAnchor="middle" fill={i === 13 ? "var(--ink)" : "var(--ink-3)"} fontWeight={i === 13 ? 600 : 400}>
            {i === 13 ? "今天" : `${new Date(d.from).getMonth() + 1}/${new Date(d.from).getDate()}`}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/* ———————————— 类型雷达 ———————————— */
const GROUPS: { label: string; types: FraudType[] }[] = [
  { label: "冒充公检法", types: ["impersonate_police"] },
  { label: "冒充客服", types: ["impersonate_service"] },
  { label: "冒充亲友", types: ["impersonate_relative", "deepfake"] },
  { label: "投资养老", types: ["fake_investment", "pension_scam", "collectibles"] },
  { label: "补贴与链接", types: ["fake_subsidy", "phishing_link"] },
  { label: "保健与中奖", types: ["health_product", "prize_lottery", "rebate_task", "romance", "fake_loan"] },
];

export function TypeRadar({ alerts }: { alerts: FamilyAlert[] }) {
  const S = 260;
  const c = S / 2;
  const R = 88;
  const counts = GROUPS.map((g) => alerts.filter((a) => a.fraudType !== "none" && a.fraudType !== "unknown" && g.types.includes(a.fraudType) && levelRank(a.level) >= 2).length);
  const max = Math.max(1, ...counts);
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / GROUPS.length;
  const pt = (i: number, r: number) => [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r] as const;
  const poly = counts.map((v, i) => pt(i, 12 + (v / max) * (R - 12)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label={`骗局类型分布：${GROUPS.map((g, i) => `${g.label} ${counts[i]}`).join("，")}`}>
      {[1, 2, 3].map((k) => (
        <polygon key={k} points={GROUPS.map((_, i) => pt(i, (R * k) / 3).join(",")).join(" ")} fill="none" stroke="var(--line-2)" />
      ))}
      {GROUPS.map((_, i) => (
        <line key={i} x1={c} y1={c} x2={pt(i, R)[0]} y2={pt(i, R)[1]} stroke="var(--line)" />
      ))}
      <polygon points={poly} fill="var(--danger)" fillOpacity="0.22" stroke="var(--danger)" strokeWidth="2" strokeLinejoin="round" />
      {counts.map((v, i) => (
        <circle key={i} cx={pt(i, 12 + (v / max) * (R - 12))[0]} cy={pt(i, 12 + (v / max) * (R - 12))[1]} r="3.5" fill="var(--danger)" />
      ))}
      {GROUPS.map((g, i) => {
        const [lx, ly] = pt(i, R + 24);
        return (
          <text key={g.label} x={lx} y={ly} fontSize="11" textAnchor="middle" dominantBaseline="middle" fill="var(--ink-2)">
            {g.label}
            <tspan fill="var(--ink)" fontWeight="600">
              {" "}
              {counts[i]}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

/* ———————————— 时段热力 ———————————— */
const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

export function HourHeatmap({ alerts }: { alerts: FamilyAlert[] }) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ n: 0, max: 0 })));
  for (const a of alerts) {
    const d = new Date(a.createdAt);
    const row = (d.getDay() + 6) % 7;
    const cell = grid[row][d.getHours()];
    cell.n++;
    cell.max = Math.max(cell.max, a.score);
  }
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[34rem] grid-cols-[1.5rem_repeat(24,minmax(0,1fr))] gap-[3px]" role="img" aria-label="星期与时段的风险热力图">
        {grid.map((row, r) => (
          <div key={r} className="contents">
            <span className="text-[10.5px] leading-[1.15rem] text-ink-3">{WEEK[r]}</span>
            {row.map((cell, h) => {
              const lv = cell.n ? scoreToLevel(cell.max) : null;
              return (
                <span
                  key={h}
                  title={cell.n ? `周${WEEK[r]} ${h}:00 · ${cell.n} 条 · 最高 ${cell.max}` : `周${WEEK[r]} ${h}:00`}
                  className="aspect-square rounded-[4px]"
                  style={{ background: lv ? LEVEL_COLOR[lv] : "var(--surface-2)", opacity: lv ? 0.35 + (cell.max / 100) * 0.65 : 1 }}
                />
              );
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center text-[10px] text-ink-3">
            {h % 6 === 0 ? h : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

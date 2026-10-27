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

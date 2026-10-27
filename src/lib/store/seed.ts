/**
 * 家属看板的演示种子数据：两位家人、过去 14 天的检测记录。
 * 全部带 demo 标记，界面上会明确标注“含演示数据”，不冒充真实统计。
 * 使用固定种子的伪随机数，保证每次重置结果一致、便于录制演示。
 */
import type { Channel, FamilyAlert, FraudType, RiskLevel } from "@/lib/core/types";

const DAY = 24 * 3600 * 1000;

interface Tpl {
  fraudType: FraudType | "none";
  level: RiskLevel;
  score: [number, number];
  channel: Channel;
  headline: string;
  preview: string;
  reasons: { point: string; evidence: string }[];
  advice?: string;
}

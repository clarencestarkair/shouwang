/**
 * 守望 · 核心领域类型
 *
 * 本文件被 Web 端 Agent、MCP Server、前端组件共同引用，
 * 只包含纯类型与常量，不依赖任何运行时环境。
 */

/** 诈骗类型枚举（与 data/cases.json 的 type 字段一致） */
export const FRAUD_TYPES = {
  impersonate_police: "冒充公检法",
  impersonate_service: "冒充客服",
  impersonate_relative: "冒充亲友",
  deepfake: "AI换脸拟声",
  fake_investment: "虚假投资理财",
  pension_scam: "养老诈骗",
  health_product: "保健品/假医疗",
  rebate_task: "刷单返利",
  romance: "网络交友",
  fake_loan: "虚假贷款/征信",
  fake_subsidy: "冒充政府补贴",
  prize_lottery: "中奖领奖",
  collectibles: "收藏品回购",
  phishing_link: "钓鱼链接",
} as const;

export type FraudType = keyof typeof FRAUD_TYPES;

export const FRAUD_TYPE_KEYS = Object.keys(FRAUD_TYPES) as [FraudType, ...FraudType[]];

/** 风险等级：safe 安全 / low 低 / medium 中 / high 高 / critical 极高（正在被骗） */
export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export const RISK_LEVELS: RiskLevel[] = ["safe", "low", "medium", "high", "critical"];

export const RISK_LABEL: Record<RiskLevel, string> = {
  safe: "安全",
  low: "低风险",
  medium: "需警惕",
  high: "高风险",
  critical: "极高风险",
};

/** 风险分数（0-100）到等级的映射，规则引擎和模型输出统一使用 */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

export function levelRank(level: RiskLevel): number {
  return RISK_LEVELS.indexOf(level);
}

/** 案例库条目 */
export interface FraudCase {
  id: string;
  type: FraudType;
  title: string;
  channels: string[];
  targetGroup: string;
  script: string;
  process: string;
  redFlags: string[];
  advice: string[];
  keywords: string[];
  lossLevel: "low" | "medium" | "high";
}

/** 反诈知识条目 */
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
}

/** 检索结果（统一案例与知识两种文档） */
export interface RetrievedDoc {
  id: string;
  kind: "case" | "knowledge";
  title: string;
  /** 用于注入上下文的正文摘要 */
  snippet: string;
  fraudType?: FraudType;
  /** 融合后得分（RRF） */
  score: number;
  /** 命中通道，用于可解释性展示 */
  matchedBy: ("bm25" | "vector")[];
}

/** 规则引擎命中的单个信号 */
export interface RiskSignal {
  id: string;
  label: string;
  /** 命中的原文片段 */
  evidence: string;
  weight: number;
  category: "pressure" | "money" | "credential" | "identity" | "channel" | "lure" | "tech";
}

/** 号码核验结果 */
export interface PhoneCheckResult {
  input: string;
  normalized: string;
  riskScore: number;
  tags: string[];
  explanation: string;
}

/** 链接核验结果 */
export interface UrlCheckResult {
  input: string;
  hostname: string | null;
  riskScore: number;
  tags: string[];
  /** 疑似仿冒的官方域名 */
  imitating?: string;
  explanation: string;
}

/** 信息来源渠道（家属看板的渠道分布） */
export type Channel = "电话" | "短信" | "微信" | "截图" | "线下" | "其他";

/** 推送给家属端的预警 */
export interface FamilyAlert {
  id: string;
  createdAt: number;
  elderName: string;
  level: RiskLevel;
  /** 风险分 0-100 */
  score: number;
  /** 信息来源渠道 */
  channel?: Channel;
  /** 是否为演示种子数据（界面会明确标注） */
  demo?: boolean;
  fraudType: RiskReport["fraudType"];
  headline: string;
  /** 已脱敏的原始内容摘要 */
  contentPreview: string;
  reasons: RiskReport["reasons"];
  familyAdvice?: string;
  status: "new" | "read" | "handled";
}

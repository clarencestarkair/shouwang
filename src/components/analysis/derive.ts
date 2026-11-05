/**
 * 从一条助手消息（+ 对应的用户消息）中派生出分析视图需要的全部数据：
 * 报告、规则命中、感知结果、工具调用、计时、模型用量。
 */
import type { GuardianUIMessage, RulesData, PerceptionData, TraceData, ToolTimeData, GuardianMetadata } from "@/lib/ai/messages";
import type { RiskReport, RetrievedDoc, PhoneCheckResult, UrlCheckResult } from "@/lib/core/types";

export interface ToolRun {
  id: string;
  name: "searchFraudCases" | "checkPhoneNumber" | "checkUrl" | "submitRiskReport" | "notifyFamily";
  state: string;
  input: unknown;
  output: unknown;
  time?: ToolTimeData;
}

export interface Analysis {
  report: RiskReport | null;
  notified: boolean;
  fallback: boolean;
  rules: RulesData | null;
  perception: PerceptionData | null;
  traces: Record<string, TraceData>;
  tools: ToolRun[];
  searches: { query: string; docs: RetrievedDoc[]; channels?: { bm25: boolean; vector: boolean } }[];
  phones: PhoneCheckResult[];
  urls: UrlCheckResult[];
  meta: GuardianMetadata | undefined;
  finalText: string;
  sourceText: string;
  busy: boolean;
}

/**
 * 兜底报告：大模型不可用（未配置、超时、限流）时，基于规则引擎 + 检索结果生成报告。
 * 保证“任何情况下老人都能得到一个安全的建议”。
 */
import type { RetrievedDoc, RiskReport } from "./types";
import { CASES } from "./rag";
import type { RuleScanResult } from "./rules";

export function buildFallbackReport(scan: RuleScanResult, docs: RetrievedDoc[]): RiskReport {
  const topCase = docs.find((d) => d.kind === "case");
  const caseData = topCase ? CASES.find((c) => c.id === topCase.id) : undefined;
  const fraudType = scan.likelyTypes[0] ?? (scan.score >= 40 ? "unknown" : "none");
  const level = scan.level;

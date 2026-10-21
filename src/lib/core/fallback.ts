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

  // 同一句原话命中多条规则时只保留权重最高的一条，避免重复
  const seen = new Set<string>();
  const reasons = [...scan.signals]
    .sort((a, b) => b.weight - a.weight)
    .filter((s) => (seen.has(s.evidence) ? false : (seen.add(s.evidence), true)))
    .slice(0, 3)
    .map((s) => ({ point: s.label, evidence: s.evidence }));
  if (reasons.length === 0) reasons.push({ point: "内容中没有出现要钱、要验证码等常见诈骗特征", evidence: "—" });

  const actions =
    level === "safe" || level === "low"
      ? ["如果对方后面提到转账、验证码，请再拿来问我"]
      : [
          "不要转账，不要说出验证码，不要点链接",
          ...(caseData?.advice.slice(0, 1) ?? []),
          "拨打 96110 反诈专线核实，或先给家里人打个电话",
        ];

  // 由命中信号推断骗局阶段：身份→1，施压/诱饵→2，保密/技术隔离→3，钱/凭证→4
  const cats = new Set(scan.signals.map((s) => s.category));
  const scamStage = level === "safe" || level === "low" ? 0 : cats.has("money") || cats.has("credential") ? 4 : scan.signals.some((s) => s.id === "secrecy" || s.category === "tech") ? 3 : cats.has("pressure") || cats.has("lure") ? 2 : cats.has("identity") ? 1 : 0;
  const shortVerdict = level === "critical" || level === "high" ? (cats.has("money") ? "别转钱" : "先别信") : level === "medium" ? "先别信" : "放心";

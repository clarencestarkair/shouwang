/**
 * 端到端 Agent 评测：pnpm eval:agent [baseUrl] [样本文件]
 * 对 data/eval.json 中每条样本调用 /api/chat（真实大模型 + 工具 + 安全审查），统计：
 *   - 规则通道：规则引擎初筛分 ≥ 40 判为诈骗
 *   - 模型通道：大模型提交报告时的原始等级（安全审查前）
 *   - 双通道最终：安全审查后的等级（≥ 需警惕 判为诈骗）
 *   - 诈骗类型识别准确率、平均工具调用次数、端到端耗时
 * 结果写入 data/<样本文件名>-agent-results.json，供技术文档引用。
 */
import fs from "node:fs";
import { levelRank, type RiskLevel } from "../src/lib/core/types";

const BASE = process.argv[2] ?? "http://localhost:3000";
const FILE = process.argv[3] ?? "data/eval.json";
const OUT = FILE.replace(/\.json$/, "-agent-results.json");
const CONCURRENCY = 5;

interface Sample {
  text: string;
  scam: boolean;
  type?: string;
}
interface Row {
  text: string;
  scam: boolean;
  type?: string;
  ruleScore: number;
  modelLevel: RiskLevel | null;
  finalLevel: RiskLevel | null;
  fraudType: string | null;
  tools: string[];
  guardNotes: string[];
  seconds: number;
  fallback: boolean;
}

async function runOne(s: Sample): Promise<Row> {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ id: "u", role: "user", parts: [{ type: "text", text: s.text }] }], profile: { elderName: "评测" } }),
  });
  const body = await res.text();
  const row: Row = { ...s, ruleScore: 0, modelLevel: null, finalLevel: null, fraudType: null, tools: [], guardNotes: [], seconds: 0, fallback: false };
  for (const line of body.split("\n")) {
    if (!line.startsWith("data: {")) continue;
    const ev = JSON.parse(line.slice(6));
    if (ev.type === "data-rules") row.ruleScore = ev.data.score;
    if (ev.type === "tool-input-available") {
      row.tools.push(ev.toolName);
      if (ev.toolName === "submitRiskReport") row.modelLevel = ev.input.level;
    }
    if (ev.type === "tool-output-available" && ev.output?.report) {
      row.finalLevel = ev.output.report.level;
      row.fraudType = ev.output.report.fraudType;
      row.guardNotes = ev.output.report.guardNotes ?? [];
    }
    if (ev.type === "data-fallback") {
      row.fallback = true;
      row.finalLevel = ev.data.report.level;
      row.fraudType = ev.data.report.fraudType;
    }
  }
  row.seconds = (Date.now() - t0) / 1000;
  return row;
}

function metrics(rows: Row[], pred: (r: Row) => boolean) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const r of rows) {
    const p = pred(r);
    if (p && r.scam) tp++;
    else if (p && !r.scam) fp++;
    else if (!p && !r.scam) tn++;
    else fn++;
  }
  return {
    accuracy: (tp + tn) / rows.length,
    precision: tp / Math.max(1, tp + fp),
    recall: tp / Math.max(1, tp + fn),
    falsePositiveRate: fp / Math.max(1, fp + tn),
  };
}

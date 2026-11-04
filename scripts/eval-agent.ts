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

async function main() {
  const samples = JSON.parse(fs.readFileSync(FILE, "utf8")) as Sample[];
  const rows: Row[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < samples.length) {
        const s = samples[next++];
        const r = await runOne(s);
        rows.push(r);
        console.log(`${rows.length}/${samples.length} ${r.scam ? "诈骗" : "正常"} 规则${r.ruleScore} 模型${r.modelLevel} 最终${r.finalLevel} ${r.seconds.toFixed(0)}s  ${s.text.slice(0, 24)}`);
      }
    }),
  );
  const atLeastMedium = (l: RiskLevel | null) => l !== null && levelRank(l) >= levelRank("medium");
  const typed = rows.filter((r) => r.type);
  const summary = {
    model: process.env.LLM_MODEL ?? "(见 .env.local)",
    samples: rows.length,
    rules: metrics(rows, (r) => r.ruleScore >= 40),
    model_only: metrics(rows, (r) => atLeastMedium(r.modelLevel)),
    dual_channel: metrics(rows, (r) => atLeastMedium(r.finalLevel)),
    typeAccuracy: typed.filter((r) => r.fraudType === r.type).length / typed.length,
    avgToolCalls: rows.reduce((s, r) => s + r.tools.length, 0) / rows.length,
    avgSeconds: rows.reduce((s, r) => s + r.seconds, 0) / rows.length,
    guardAdjusted: rows.filter((r) => r.guardNotes.length > 0).length,
    fallbacks: rows.filter((r) => r.fallback).length,
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 2));
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log("\n通道        准确率   精确率   召回率   误报率");
  for (const [k, m] of [["规则", summary.rules], ["模型", summary.model_only], ["双通道", summary.dual_channel]] as const)
    console.log(`${k.padEnd(8)} ${pct(m.accuracy).padStart(7)} ${pct(m.precision).padStart(7)} ${pct(m.recall).padStart(7)} ${pct(m.falsePositiveRate).padStart(7)}`);
  console.log(`类型识别准确率 ${pct(summary.typeAccuracy)}  平均工具调用 ${summary.avgToolCalls.toFixed(1)} 次  平均耗时 ${summary.avgSeconds.toFixed(1)}s  安全审查修正 ${summary.guardAdjusted} 例  兜底 ${summary.fallbacks} 例`);
  for (const r of rows.filter((r) => r.type && r.fraudType !== r.type)) console.log(`类型不一致：期望 ${r.type} 得到 ${r.fraudType} | ${r.text.slice(0, 30)}`);
}

main();

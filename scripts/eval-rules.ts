/**
 * 离线评测：pnpm eval
 * 1. 规则引擎的诈骗识别准确率 / 精确率 / 召回率 / 误报率（阈值：风险分 ≥ 40 视为诈骗）
 * 2. RAG 检索的 Hit@3：前 3 条结果中是否包含同类型案例
 * 评测集 data/eval.json 包含 20 条诈骗样本（覆盖 14 类 + 提示词注入）与 10 条正常消息。
 */
import fs from "node:fs";
import { scanText } from "../src/lib/core/rules";
import { hybridSearch } from "../src/lib/core/rag";
import type { FraudType } from "../src/lib/core/types";

interface Sample {
  text: string;
  scam: boolean;
  type?: FraudType;
}

const samples = JSON.parse(fs.readFileSync("data/eval.json", "utf8")) as Sample[];
const THRESHOLD = 40;

async function main() {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0,
    hit = 0,
    typed = 0;
  const misses: string[] = [];
  for (const s of samples) {
    const r = scanText(s.text);
    const pred = r.score >= THRESHOLD;
    if (pred && s.scam) tp++;
    else if (pred && !s.scam) {
      fp++;
      misses.push(`误报(${r.score})：${s.text.slice(0, 30)}`);
    } else if (!pred && !s.scam) tn++;
    else {
      fn++;
      misses.push(`漏报(${r.score})：${s.text.slice(0, 30)}`);
    }
    if (s.type) {
      typed++;
      const { docs } = await hybridSearch(s.text, { topK: 3, kind: "case" });
      if (docs.some((d) => d.fraudType === s.type)) hit++;
      else misses.push(`检索未命中 ${s.type}：${docs.map((d) => d.fraudType).join(",")}`);
    }
  }
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log(`样本数：${samples.length}（诈骗 ${tp + fn}，正常 ${tn + fp}）`);
  console.log(`规则引擎  准确率 ${pct((tp + tn) / samples.length)}  精确率 ${pct(tp / Math.max(1, tp + fp))}  召回率 ${pct(tp / Math.max(1, tp + fn))}  误报率 ${pct(fp / Math.max(1, fp + tn))}`);
  console.log(`RAG 检索  Hit@3 ${pct(hit / Math.max(1, typed))}（仅 BM25 通道）`);
  if (misses.length) console.log("\n明细：\n" + misses.join("\n"));
}

main();

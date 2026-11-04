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

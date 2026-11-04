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

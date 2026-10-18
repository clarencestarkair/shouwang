/**
 * 规则引擎：基于反诈领域知识的可解释风险信号检测。
 *
 * 作用：
 * 1. 作为 Agent 的前置“初筛”，为大模型提供结构化线索；
 * 2. 作为“双通道校验”的另一通道，防止大模型漏判；
 * 3. 作为大模型不可用时的兜底降级方案。
 */
import type { FraudType, RiskSignal } from "./types";
import { scoreToLevel } from "./types";

interface Rule {
  id: string;
  label: string;
  category: RiskSignal["category"];
  weight: number;
  pattern: RegExp;
  /** 该信号强关联的诈骗类型，用于类型推断 */
  hints?: FraudType[];
}

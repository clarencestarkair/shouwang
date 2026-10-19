/**
 * AI 安全层：
 * - maskPII：个人敏感信息脱敏（浏览器端与服务端共用，端侧先脱敏再上云）
 * - detectInjection：检测待分析内容中的提示词注入（诈骗短信本身就可能夹带“忽略以上指令”）
 * - guardReport：对 Agent 输出的风险报告做安全审查与兜底修正
 */
import type { RiskReport, RiskLevel } from "./types";
import { levelRank, scoreToLevel } from "./types";

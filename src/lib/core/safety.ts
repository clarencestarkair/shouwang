/**
 * AI 安全层：
 * - maskPII：个人敏感信息脱敏（浏览器端与服务端共用，端侧先脱敏再上云）
 * - detectInjection：检测待分析内容中的提示词注入（诈骗短信本身就可能夹带“忽略以上指令”）
 * - guardReport：对 Agent 输出的风险报告做安全审查与兜底修正
 */
import type { RiskReport, RiskLevel } from "./types";
import { levelRank, scoreToLevel } from "./types";

const PII_PATTERNS: { label: string; re: RegExp; keep: (m: string) => string }[] = [
  // 18 位身份证
  { label: "身份证号", re: /\b[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, keep: (m) => `${m.slice(0, 3)}***********${m.slice(-4)}` },
  // 银行卡 16-19 位
  { label: "银行卡号", re: /\b(?:62|4\d|5[1-5])\d{14,17}\b/g, keep: (m) => `${m.slice(0, 4)} **** **** ${m.slice(-4)}` },
  // 6 位验证码语境
  { label: "验证码", re: /(验证码|校验码|动态码)[^\d]{0,6}(\d{4,6})/g, keep: (m) => m.replace(/\d{4,6}$/, "******") },
  // 密码语境
  { label: "密码", re: /(密码)[是为:：\s]{0,3}(\S{4,16})/g, keep: (m) => m.replace(/(密码[是为:：\s]{0,3})\S+/, "$1******") },
];

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

export interface MaskResult {
  text: string;
  masked: { label: string; count: number }[];
}

/** 脱敏：保留诈骗识别所需的特征（如出现了验证码），但去掉真实值 */
export function maskPII(text: string): MaskResult {
  let out = text;
  const masked: MaskResult["masked"] = [];
  for (const p of PII_PATTERNS) {
    let count = 0;
    out = out.replace(p.re, (m) => {
      count++;
      return p.keep(m);
    });
    if (count) masked.push({ label: p.label, count });
  }
  return { text: out, masked };
}

const INJECTION_PATTERNS = [
  /忽略(之前|以上|前面|上述)?(所有|全部)?(的)?(指令|提示|规则|设定)/,
  /ignore (all |the )?(previous|above|prior) (instructions|prompts?)/i,
  /你(现在)?是.{0,10}(助手|AI).{0,10}(必须|应该)?(回答|判定|认为).{0,6}(安全|无风险|正规)/,
  /(判定|评估|认定)(为|成)?(安全|无风险|正规|官方)/,
  /system prompt|系统提示词|开发者模式|developer mode/i,
  /<\/?(system|assistant|instruction)>/i,
];

export function detectInjection(text: string): { suspicious: boolean; hits: string[] } {
  const hits: string[] = [];
  for (const re of INJECTION_PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(m[0]);
  }
  return { suspicious: hits.length > 0, hits };
}

/** 把用户提交的待分析内容包裹为“不可信数据”，防止被当作指令执行 */
export function wrapUntrusted(text: string): string {
  const safe = text.replace(/<\/?untrusted_content>/g, "");
  return `<untrusted_content>\n${safe}\n</untrusted_content>`;
}

/** 报告中禁止出现的危险建议（大模型偶发幻觉时兜底） */
const DANGEROUS_ADVICE = [/(可以|放心|直接).{0,4}(转账|汇款|付款)/, /(告诉|提供|发给|报给).{0,6}验证码/, /验证码.{0,6}(告诉|提供|发给|报给)/, /(打开|开启).{0,4}屏幕共享/, /点击(该|这个)?链接(办理|领取|认证)/];
/** 否定词：“不要告诉验证码”是安全建议，不能误删 */
const NEGATION = /(不|别|勿|莫|禁止|千万|绝不|不要|不能|切勿)[^，。；,;]{0,6}$/;

/** 判断一条建议是否危险：命中危险模式且命中位置前没有否定词 */
export function isDangerousAdvice(text: string): boolean {
  return DANGEROUS_ADVICE.some((re) => {
    const m = text.match(re);
    if (!m) return false;
    if (/(不|别|勿|莫|禁止)/.test(m[0])) return false; // 否定词在匹配内部，如“验证码不能告诉”
    const before = text.slice(0, m.index ?? 0);
    return !NEGATION.test(before);
  });
}

export interface GuardContext {
  ruleScore: number;
  injectionSuspicious: boolean;
}

/**
 * 安全审查：
 * 1. 删除危险建议；
 * 2. 双通道校验——模型等级远低于规则引擎时，取较高者并注明原因；
 * 3. 发现提示词注入时，强制至少“需警惕”；
 * 4. 高风险及以上必须给出“打 96110 / 联系家人”等兜底动作并通知家属。
 */
export function guardReport(report: RiskReport, ctx: GuardContext): RiskReport {
  const notes: string[] = [];
  const r: RiskReport = { ...report, reasons: [...report.reasons], actions: [...report.actions] };

  const before = r.actions.length;
  r.actions = r.actions.filter((a) => !isDangerousAdvice(a));
  if (r.actions.length < before) notes.push("已移除 1 条不安全的建议");

  const ruleLevel = scoreToLevel(ctx.ruleScore);
  if (levelRank(ruleLevel) - levelRank(r.level) >= 2) {
    notes.push(`规则引擎判定为「${ruleLevel}」，高于模型判断，按“就高不就低”原则上调`);
    r.level = ruleLevel;
    r.score = Math.max(r.score, ctx.ruleScore);
  }

  if (ctx.injectionSuspicious && levelRank(r.level) < levelRank("medium")) {
    notes.push("内容中检测到试图操纵 AI 判断的语句，这本身就是可疑特征");
    r.level = "medium";
    r.score = Math.max(r.score, 45);
    r.reasons.push({ point: "内容里藏着想骗过 AI 的话", evidence: "检测到“判定为安全”等操纵性语句" });
  }

  // 分数与等级保持一致
  if (levelRank(scoreToLevel(r.score)) < levelRank(r.level)) {
    const floor: Record<RiskLevel, number> = { safe: 0, low: 20, medium: 40, high: 65, critical: 85 };
    r.score = floor[r.level];
  }

  if (levelRank(r.level) >= levelRank("high")) {
    r.notifyFamily = true;
    const hasHotline = r.actions.some((a) => a.includes("96110") || a.includes("110"));
    if (!hasHotline) r.actions.push("拿不准就拨打 96110 反诈专线咨询，已经转账请立刻拨打 110");
  }

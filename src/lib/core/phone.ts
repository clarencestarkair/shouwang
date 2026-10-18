/**
 * 号码风险核验（离线规则版）。
 *
 * 真实生产环境应接入运营商/反诈中心的号码标记接口；
 * 这里实现基于号段特征的可解释判断，并预留了接口替换点。
 */
import type { PhoneCheckResult } from "./types";

/** 常见官方客服号码（白名单示例，用于识别“看起来像但不是”的号码） */
const OFFICIAL_NUMBERS: Record<string, string> = {
  "110": "报警电话",
  "96110": "反诈预警劝阻专线",
  "12381": "工信部涉诈预警短信",
  "12345": "政务服务便民热线",
  "12333": "人社服务热线（社保/养老金）",
  "12393": "医保服务热线",
  "95588": "工商银行",
  "95533": "建设银行",
  "95599": "农业银行",
  "95566": "中国银行",
  "95555": "招商银行",
  "95580": "邮储银行",
  "10086": "中国移动",
  "10010": "中国联通",
  "10000": "中国电信",
};

/** 虚拟运营商号段（诈骗高发但并非全部是诈骗） */
const VIRTUAL_PREFIX = ["170", "171", "162", "165", "167"];

export function checkPhone(input: string): PhoneCheckResult {
  const normalized = input.replace(/[\s\-()（）]/g, "");
  const digits = normalized.replace(/^\+/, "");
  const tags: string[] = [];
  let score = 0;

  if (OFFICIAL_NUMBERS[digits]) {
    return {
      input,
      normalized,
      riskScore: 0,
      tags: ["官方号码"],
      explanation: `${digits} 是${OFFICIAL_NUMBERS[digits]}的官方号码。但注意：来电显示可以被伪造，涉及转账请挂断后自己回拨官方号码核实。`,
    };
  }

  if (/^\+?00/.test(normalized) || /^\+(?!86)\d+/.test(normalized)) {
    score += 55;
    tags.push("境外/异常前缀");
  }
  if (/^\+86/.test(normalized) && normalized.length > 14) {
    score += 20;
    tags.push("号码长度异常");
  }
  const local = digits.replace(/^86/, "");
  if (VIRTUAL_PREFIX.some((p) => local.startsWith(p))) {
    score += 30;
    tags.push("虚拟运营商号段");
  }
  // 冒充银行客服：95/96 开头但不是官方号码，或者带后缀的 95 号
  if (/^9[56]\d{3,}/.test(local) && !OFFICIAL_NUMBERS[local]) {
    score += local.length > 5 ? 35 : 20;
    tags.push("仿冒客服短号");
  }
  if (/^106\d{5,17}$/.test(local)) {
    score += 10;
    tags.push("106 企业短信号（谁都能申请，签名可伪造）");
  }
  if (/^400\d{7}$/.test(local)) {
    score += 15;
    tags.push("400 企业号码（需核实归属）");
  }
  if (/^1[3-9]\d{9}$/.test(local) && tags.length === 0) {
    score += 5;
    tags.push("普通手机号");
  }
  if (local.length < 5 || local.length > 13) {
    score += 15;
    tags.push("位数异常");
  }

  const riskScore = Math.min(100, score);
  const explanation =
    riskScore >= 50
      ? `这个号码有明显异常（${tags.join("、")}），诈骗分子常用这类号码伪装身份。`
      : riskScore >= 20
        ? `这个号码有可疑特征（${tags.join("、")}），请不要按对方说的操作，挂断后打官方电话核实。`
        : "号码本身没有明显异常，但是否诈骗主要看对方说了什么、要你做什么。";

  return { input, normalized, riskScore, tags, explanation };
}

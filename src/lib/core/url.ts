/**
 * 链接风险核验：仿冒域名检测（编辑距离 + 关键词嵌入）、
 * 高风险顶级域、IP 直连、短链、Punycode 同形字攻击等。
 */
import type { UrlCheckResult } from "./types";

/** 老年人高频接触的官方域名白名单 */
const OFFICIAL_DOMAINS: Record<string, string> = {
  "gov.cn": "政府网站",
  "12333.gov.cn": "人社部",
  "nhsa.gov.cn": "国家医保局",
  "chinatax.gov.cn": "国家税务总局",
  "icbc.com.cn": "工商银行",
  "ccb.com": "建设银行",
  "abchina.com": "农业银行",
  "boc.cn": "中国银行",
  "cmbchina.com": "招商银行",
  "psbc.com": "邮储银行",
  "alipay.com": "支付宝",
  "taobao.com": "淘宝",
  "jd.com": "京东",
  "pinduoduo.com": "拼多多",
  "10086.cn": "中国移动",
  "chinaunicom.com": "中国联通",
  "189.cn": "中国电信",
  "sf-express.com": "顺丰",
  "ems.com.cn": "邮政EMS",
  "weixin.qq.com": "微信",
  "qq.com": "腾讯",
};

const RISKY_TLDS = ["top", "xyz", "cc", "vip", "icu", "club", "shop", "work", "buzz", "live", "online", "site", "fun", "tk", "ml"];
const SHORTENERS = ["t.cn", "url.cn", "dwz.cn", "bit.ly", "tinyurl.com", "suo.im", "w.url.cn"];
const LURE_WORDS = ["gov", "etc", "yibao", "shebao", "ylj", "tax", "bank", "pay", "refund", "verify", "kefu", "12333", "95588", "jd", "taobao", "alipay"];

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function parseHost(input: string): string | null {
  try {
    const withProto = /^[a-z]+:\/\//i.test(input) ? input : `http://${input}`;
    return new URL(withProto).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** 注册域名（粗略取最后两段，对 .com.cn / .gov.cn 等取三段） */
function registrable(host: string): string {
  const parts = host.split(".");
  const twoLevel = ["com.cn", "gov.cn", "org.cn", "net.cn", "edu.cn"];
  const lastTwo = parts.slice(-2).join(".");
  if (twoLevel.includes(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
  return lastTwo;
}

export function checkUrl(input: string): UrlCheckResult {
  const hostname = parseHost(input.trim());
  if (!hostname) {
    return { input, hostname: null, riskScore: 30, tags: ["无法解析"], explanation: "这不是一个正常的网址格式，不要点击。" };
  }

  const tags: string[] = [];
  let score = 0;
  let imitating: string | undefined;
  const reg = registrable(hostname);

  // 官方域名或其子域：低风险
  const officialHit = Object.keys(OFFICIAL_DOMAINS).find((d) => hostname === d || hostname.endsWith(`.${d}`));
  if (officialHit) {
    return {
      input,
      hostname,
      riskScore: 5,
      tags: ["官方域名"],
      explanation: `这是${OFFICIAL_DOMAINS[officialHit]}的官方域名。但仍然不要在任何网页里输入验证码给别人看。`,
    };
  }

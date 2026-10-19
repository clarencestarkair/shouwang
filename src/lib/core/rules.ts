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

const RULES: Rule[] = [
  // —— 资金类：最核心的诈骗终点 ——
  { id: "safe_account", label: "要求转入“安全账户”", category: "money", weight: 45, pattern: /安全账户|资金清查|资金核查|监管账户/, hints: ["impersonate_police"] },
  { id: "transfer", label: "要求转账/汇款", category: "money", weight: 22, pattern: /转账|汇款|打款|转到|转给|打到.{0,6}账户/ },
  { id: "fee_first", label: "先交费用才能拿钱", category: "money", weight: 30, pattern: /保证金|解冻费|手续费|激活费|会员费|服务费|税费|公证费|刷流水|验资/, hints: ["fake_loan", "prize_lottery", "rebate_task"] },
  { id: "high_return", label: "承诺高额回报", category: "lure", weight: 28, pattern: /稳赚|保本|高回报|高收益|日赚|翻倍|内幕|稳赚不赔|躺赚|零风险|分红/, hints: ["fake_investment", "pension_scam"] },
  { id: "borrow_urgent", label: "以急事为由借钱", category: "money", weight: 28, pattern: /(借|急用|周转|垫).{0,8}(钱|万|千|块)|(住院|手术|出事|被抓|撞).{0,20}(借|要钱|转|赔)/, hints: ["impersonate_relative"] },
  { id: "rebate", label: "刷单/做任务返利", category: "lure", weight: 30, pattern: /刷单|点赞.{0,4}(返|佣金)|做任务|垫付|返佣|返利/, hints: ["rebate_task"] },

  // —— 凭证类 ——
  { id: "verify_code", label: "索要验证码", category: "credential", weight: 40, pattern: /验证码|校验码|动态码/ },
  { id: "verify_redirect", label: "以“失效/异常”为由让您登录认证", category: "tech", weight: 25, pattern: /(失效|异常|过期|冻结|停用|清零).{0,20}(认证|登录|激活|解冻|兑换)/, hints: ["phishing_link", "fake_subsidy"] },
  { id: "screen_share", label: "要求屏幕共享", category: "tech", weight: 42, pattern: /屏幕共享|共享屏幕|会议.{0,4}(号|软件)|远程控制|向日葵|腾讯会议|ToDesk/i },
  { id: "bank_info", label: "索要银行卡/密码", category: "credential", weight: 32, pattern: /银行卡号|卡号|密码|身份证.{0,3}(照片|正反面)|CVV|有效期/i },
  { id: "download_app", label: "诱导下载陌生App", category: "tech", weight: 25, pattern: /下载.{0,8}(app|App|APP|软件|客户端)|安装.{0,6}(软件|插件)|扫码下载/ },

  // —— 身份冒充 ——
  { id: "fake_police", label: "自称公检法人员", category: "identity", weight: 30, pattern: /公安局|派出所|检察院|法院|警官|民警|通缉|逮捕令|洗钱|涉嫌.{0,6}(案|犯罪)/, hints: ["impersonate_police"] },
  { id: "fake_service", label: "自称客服/理赔", category: "identity", weight: 22, pattern: /客服|理赔|退款|快递.{0,4}(丢|损)|百万保障|注销.{0,6}(账户|服务)|会员.{0,4}自动扣费/, hints: ["impersonate_service"] },
  { id: "fake_relative", label: "冒充亲友急需用钱", category: "identity", weight: 28, pattern: /(爸|妈|爷爷|奶奶|姥姥|外婆|外公|老同学|领导).{0,10}(出事|急用|借|住院|被抓|手术)|换(了)?(新)?号码|手机(掉|坏)了/, hints: ["impersonate_relative"] },
  { id: "fake_gov", label: "冒充政府部门发补贴", category: "identity", weight: 26, pattern: /养老金.{0,6}(认证|资格)|医保卡.{0,4}(异常|冻结|停用)|社保卡.{0,4}(升级|异常)|补贴|退税|高龄津贴/, hints: ["fake_subsidy"] },
  { id: "deepfake", label: "视频/语音可能是AI合成", category: "tech", weight: 18, pattern: /视频.{0,6}(借钱|转账)|声音.{0,4}(一样|很像)|AI换脸|换脸/, hints: ["deepfake"] },

  // —— 心理操纵 ——
  { id: "urgency", label: "制造紧迫感", category: "pressure", weight: 15, pattern: /立即|马上|立刻|尽快|限时|今天之内|\d+\s*(小时|分钟)内|过期|最后一天|逾期/ },
  { id: "secrecy", label: "要求保密、不让告诉家人", category: "pressure", weight: 35, pattern: /保密|不要告诉|别告诉|不能告诉|不许告诉|泄露.{0,4}(案情|秘密)|单独/ },
  { id: "threat", label: "恐吓威胁", category: "pressure", weight: 20, pattern: /冻结|拘留|坐牢|起诉|影响征信|影响子女|黑名单|上征信/ },

  // —— 诱饵 ——
  { id: "prize", label: "中奖/免费领奖", category: "lure", weight: 22, pattern: /中奖|恭喜您|免费领|领取.{0,4}(奖|礼)|抽中|幸运用户/, hints: ["prize_lottery"] },
  { id: "health", label: "神药/包治百病", category: "lure", weight: 30, pattern: /包治|根治|神药|特效药|祖传|专家义诊|免费体检|免费讲座|降三高/, hints: ["health_product"] },
  { id: "free_bait", label: "免费送东西引您过去", category: "lure", weight: 15, pattern: /免费(讲座|体检|领|送|旅游)|送(鸡蛋|礼品|大米)|限前\d+名/, hints: ["health_product"] },
  { id: "group_teacher", label: "拉进群、跟“老师”炒股", category: "lure", weight: 22, pattern: /(加入|拉你进|进).{0,6}群|老师带|带单|荐股/, hints: ["fake_investment"] },
  { id: "pension", label: "养老项目/以房养老", category: "lure", weight: 28, pattern: /以房养老|养老公寓|养老基地|养老项目|床位.{0,4}(预订|认购)|候鸟养老/, hints: ["pension_scam"] },
  { id: "collect", label: "收藏品高价回购", category: "lure", weight: 26, pattern: /纪念币|邮票|字画|古董|藏品|回购|拍卖/, hints: ["collectibles"] },
  { id: "loan", label: "无抵押秒批贷款/征信修复", category: "lure", weight: 24, pattern: /无抵押|秒批|低息贷款|征信修复|洗白征信|注销.{0,4}校园贷/, hints: ["fake_loan"] },
  { id: "romance", label: "网恋对象谈钱", category: "lure", weight: 20, pattern: /(宝贝|亲爱的|老公|老婆).{0,20}(投资|平台|借|转)|带你(赚|投资)/, hints: ["romance"] },

  // —— 渠道 ——
  { id: "foreign_number", label: "境外或伪装号码", category: "channel", weight: 20, pattern: /\+00|\+\d{3,}|00\d{2,}/ },
  { id: "risky_tld", label: "链接后缀可疑", category: "channel", weight: 20, pattern: /\.(top|xyz|cc|vip|icu|club|shop|work|buzz)\b/i },
  { id: "suspicious_link", label: "含有链接", category: "channel", weight: 10, pattern: /https?:\/\/|www\.|\.(cn|com|top|xyz|cc|vip|net)\b/i },
];

/** 取命中位置所在的分句作为证据（以标点为界，最长 40 字），便于老人对照原话 */
function clauseAround(text: string, idx: number, len: number): string {
  const BOUND = /[，。！？；,.!?;\n]/;
  let s = idx;
  while (s > 0 && !BOUND.test(text[s - 1]) && idx - s < 20) s--;
  let e = idx + len;
  while (e < text.length && !BOUND.test(text[e]) && e - idx < 30) e++;
  return text.slice(s, e).replace(/\s+/g, " ").trim();
}

/** 规则数量（用于展示） */
export const RULE_COUNT = RULES.length;

export interface RuleScanResult {
  score: number;
  level: ReturnType<typeof scoreToLevel>;
  signals: RiskSignal[];
  /** 根据信号推断的最可能诈骗类型 */
  likelyTypes: FraudType[];
}

/**
 * 扫描文本中的风险信号。
 * 分数计算：信号权重相加后做软饱和（避免多个弱信号线性叠加到满分），
 * 同时“资金 + 心理操纵”组合额外加分——这是诈骗最典型的结构。
 */
export function scanText(text: string): RuleScanResult {
  const signals: RiskSignal[] = [];
  const typeVotes = new Map<FraudType, number>();

  for (const rule of RULES) {
    const m = text.match(rule.pattern);
    if (!m) continue;
    const evidence = clauseAround(text, m.index ?? 0, m[0].length);
    signals.push({ id: rule.id, label: rule.label, evidence, weight: rule.weight, category: rule.category });
    for (const t of rule.hints ?? []) typeVotes.set(t, (typeVotes.get(t) ?? 0) + rule.weight);
  }

  const likelyTypes = [...typeVotes.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 3);

  return { score, level: scoreToLevel(score), signals, likelyTypes };
}

/** 粗略判断信息来源渠道（用于家属端渠道分布） */
export function detectChannel(text: string, hasImage: boolean): "电话" | "短信" | "微信" | "截图" | "线下" | "其他" {
  if (hasImage) return "截图";
  if (/打电话|来电|电话里|接到.{0,4}电话|视频通话|打给我/.test(text)) return "电话";
  if (/微信|朋友圈|群里|加我/.test(text)) return "微信";
  if (/^【|短信|退订/.test(text)) return "短信";
  if (/传单|讲座|上门|门口|会馆|现场/.test(text)) return "线下";
  return "其他";
}

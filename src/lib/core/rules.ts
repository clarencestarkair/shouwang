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

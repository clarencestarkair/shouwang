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

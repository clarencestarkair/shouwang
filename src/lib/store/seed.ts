/**
 * 家属看板的演示种子数据：两位家人、过去 14 天的检测记录。
 * 全部带 demo 标记，界面上会明确标注“含演示数据”，不冒充真实统计。
 * 使用固定种子的伪随机数，保证每次重置结果一致、便于录制演示。
 */
import type { Channel, FamilyAlert, FraudType, RiskLevel } from "@/lib/core/types";

const DAY = 24 * 3600 * 1000;

interface Tpl {
  fraudType: FraudType | "none";
  level: RiskLevel;
  score: [number, number];
  channel: Channel;
  headline: string;
  preview: string;
  reasons: { point: string; evidence: string }[];
  advice?: string;
}

const TEMPLATES: Tpl[] = [
  { fraudType: "impersonate_police", level: "critical", score: [90, 98], channel: "电话", headline: "自称警察说涉嫌洗钱，是骗子", preview: "来电 +00 852 …… 自称上海市公安局，称名下银行卡涉嫌洗钱，要求保密并将存款转入安全账户……", reasons: [{ point: "警察不会打电话让您转钱到“安全账户”", evidence: "将存款转入安全账户" }, { point: "要求保密、不告诉家人", evidence: "要求保密" }], advice: "尽快打个电话，先夸她第一时间来问，再确认没有转账。教她一句：公安不会打电话让转钱。" },
  { fraudType: "fake_subsidy", level: "high", score: [74, 86], channel: "短信", headline: "“医保卡异常”短信是骗子发的", preview: "【医保局】您的医保卡因异常已被冻结，请于24小时内点击 yibao-gov-cn.top 认证解冻……", reasons: [{ point: "医保局不会发链接让您“解冻”医保卡", evidence: "点击 yibao-gov-cn.top 认证解冻" }, { point: "链接是假冒的官方网址", evidence: "yibao-gov-cn.top" }], advice: "一起打开国家医保服务平台 App 看看医保卡状态，让他亲眼看到一切正常。" },
  { fraudType: "impersonate_relative", level: "critical", score: [85, 95], channel: "微信", headline: "“孙子换号借钱”是冒充亲人", preview: "奶奶，我是小军，我换号了。把人家车撞了，要先赔两万，别告诉我爸妈……", reasons: [{ point: "换新号码又急着要钱，是冒充亲人的典型套路", evidence: "我换号了" }, { point: "不让告诉父母", evidence: "别告诉我爸妈" }], advice: "和老人约定一个只有家里人知道的“暗号”，以后凡是借钱先对暗号。" },
  { fraudType: "health_product", level: "medium", score: [45, 60], channel: "线下", headline: "免费体检讲座可能是推销保健品", preview: "社区门口发的传单：专家义诊，免费体检，送鸡蛋，限前50名……", reasons: [{ point: "“免费送东西”常常是为了把人拉去听推销", evidence: "免费体检，送鸡蛋" }], advice: "不用直接反对，可以陪他去一次，或者约去正规医院体检。" },
  { fraudType: "pension_scam", level: "high", score: [70, 84], channel: "线下", headline: "养老公寓“预订床位分红”不可信", preview: "某养老公寓火热认购，预订床位年化分红15%，名额有限今天截止……", reasons: [{ point: "承诺高分红的养老项目大多是非法集资", evidence: "年化分红15%" }], advice: "一起去民政部门官网查这家机构有没有备案。" },
  { fraudType: "fake_investment", level: "high", score: [72, 88], channel: "微信", headline: "“老师带炒股”群是投资诈骗", preview: "王老师带您稳赚不赔，内幕消息，加入投资群跟着操作日赚上千……", reasons: [{ point: "“稳赚不赔”的投资一定是骗局", evidence: "稳赚不赔" }], advice: "帮老人退出陌生投资群，把手机里的陌生理财 App 卸载。" },
  { fraudType: "phishing_link", level: "high", score: [68, 80], channel: "短信", headline: "“ETC 失效”短信是钓鱼链接", preview: "【ETC服务】您的ETC卡已失效，请立即登录 etc-renew.xyz 重新认证……", reasons: [{ point: "链接后缀可疑，冒充官方服务", evidence: "etc-renew.xyz" }] },
  { fraudType: "prize_lottery", level: "high", score: [66, 80], channel: "短信", headline: "“中奖先交手续费”是骗局", preview: "恭喜您被抽中为幸运用户，获得价值8888元大奖，领取前需缴纳手续费600元……", reasons: [{ point: "中奖要先交钱，一律是骗子", evidence: "领取前需缴纳手续费" }] },
  { fraudType: "impersonate_service", level: "critical", score: [86, 94], channel: "电话", headline: "“京东客服关闭百万保障”是骗子", preview: "我是京东客服，您开通了百万保障，每月自动扣费，注销需要屏幕共享并报验证码……", reasons: [{ point: "正规客服不会让您屏幕共享", evidence: "注销需要屏幕共享" }, { point: "验证码不能告诉任何人", evidence: "报验证码" }], advice: "教他：凡是让开屏幕共享的，直接挂断。" },
  { fraudType: "collectibles", level: "medium", score: [42, 58], channel: "电话", headline: "“高价回购纪念币”要先交鉴定费", preview: "您家里的老纪念币我们高价回购，先交鉴定费和拍卖服务费……", reasons: [{ point: "回购前先收费是常见套路", evidence: "先交鉴定费" }] },
  { fraudType: "none", level: "safe", score: [3, 12], channel: "短信", headline: "社区通知接种流感疫苗，是正常消息", preview: "XX社区卫生服务中心：65岁以上老人可免费接种流感疫苗，请携带身份证到中心二楼……", reasons: [{ point: "没有要钱、没有链接，地点是熟悉的社区医院", evidence: "请携带身份证到中心二楼" }] },
  { fraudType: "none", level: "safe", score: [2, 10], channel: "短信", headline: "银行扣款提醒，是正常消息", preview: "【工商银行】您尾号1234的账户支出人民币56.00元，余额3,210.55元……", reasons: [{ point: "只是账户变动提醒，没有链接、没有要求操作", evidence: "支出人民币56.00元" }] },
  { fraudType: "none", level: "low", score: [18, 30], channel: "微信", headline: "老同学聚会通知，暂无风险", preview: "老张，下周六中午同学聚会，地点还是老地方，AA制……", reasons: [{ point: "熟人邀约，没有涉及转账", evidence: "AA制" }] },
];

/** 固定种子的伪随机数（mulberry32） */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 老人收到可疑信息的高发时段：上午 8-11 点、傍晚 18-21 点 */
const HOURS = [8, 9, 9, 10, 10, 11, 14, 15, 16, 18, 19, 19, 20, 20, 21];

export function seedAlerts(): FamilyAlert[] {
  const r = rng(20261118);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows: FamilyAlert[] = [];
  const elders: [string, number][] = [
    ["妈妈", 30],
    ["爸爸", 18],
  ];
  for (const [elderName, count] of elders) {
    for (let i = 0; i < count; i++) {
      const tpl = TEMPLATES[Math.floor(r() * TEMPLATES.length)];
      const dayOffset = Math.floor(r() * 14);
      const hour = HOURS[Math.floor(r() * HOURS.length)];
      const createdAt = today.getTime() - dayOffset * DAY + hour * 3600e3 + Math.floor(r() * 60) * 60e3;
      if (createdAt > Date.now() - 30 * 60e3) continue; // 不生成“未来”或刚刚的记录
      const score = Math.round(tpl.score[0] + r() * (tpl.score[1] - tpl.score[0]));
      rows.push({
        id: `seed-${elderName}-${i}`,
        createdAt,
        elderName,
        level: tpl.level,
        score,
        channel: tpl.channel,
        fraudType: tpl.fraudType,
        headline: tpl.headline,
        contentPreview: tpl.preview,
        reasons: tpl.reasons,
        familyAdvice: tpl.advice,
        status: dayOffset === 0 && tpl.level !== "safe" ? "new" : dayOffset < 3 && r() < 0.4 ? "read" : "handled",
        demo: true,
      });
    }
  }
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

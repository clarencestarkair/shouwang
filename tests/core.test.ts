/**
 * 核心模块单元测试：pnpm test
 * 覆盖规则引擎、号码/链接核验、安全护栏、RAG 检索、兜底报告。
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractEntities, scanText } from "../src/lib/core/rules";
import { checkPhone } from "../src/lib/core/phone";
import { checkUrl } from "../src/lib/core/url";
import { detectInjection, guardReport, isDangerousAdvice, maskPII, wrapUntrusted } from "../src/lib/core/safety";
import { hybridSearch, tokenize, CASES, KNOWLEDGE } from "../src/lib/core/rag";
import { buildFallbackReport } from "../src/lib/core/fallback";
import { scoreToLevel, FRAUD_TYPE_KEYS, type RiskReport } from "../src/lib/core/types";

describe("规则引擎", () => {
  it("冒充公检法 + 安全账户 + 保密 → 极高风险", () => {
    const r = scanText("我是公安局的，你涉嫌洗钱，把钱转到安全账户，不要告诉家人");
    assert.equal(r.level, "critical");
    assert.equal(r.likelyTypes[0], "impersonate_police");
    assert.ok(r.signals.some((s) => s.id === "secrecy"));
  });
  it("正常家人消息不报警", () => {
    assert.equal(scanText("妈，我今天加班晚点回来，你们先吃饭").level, "safe");
  });
  it("证据为命中位置所在的分句", () => {
    const s = scanText("你好。请把验证码发给我，谢谢").signals.find((x) => x.id === "verify_code");
    assert.equal(s?.evidence, "请把验证码发给我");
  });
  it("抽取号码与链接", () => {
    const e = extractEntities("联系 +00 852 6123 4567 或访问 https://yibao-gov-cn.top/renew");
    assert.ok(e.phones.some((p) => p.includes("0085261234567")));
    assert.ok(e.urls.some((u) => u.includes("yibao-gov-cn.top")));
  });
});

describe("号码核验", () => {
  it("官方号码低风险", () => assert.equal(checkPhone("96110").riskScore, 0));
  it("境外前缀高风险", () => assert.ok(checkPhone("+00 852 6123 4567").riskScore >= 50));
  it("仿冒银行客服长号", () => assert.ok(checkPhone("955880001").tags.includes("仿冒客服短号")));
  it("虚拟号段", () => assert.ok(checkPhone("17012345678").tags.includes("虚拟运营商号段")));
});

describe("链接核验", () => {
  it("官方域名低风险", () => assert.ok(checkUrl("https://www.nhsa.gov.cn/x").riskScore < 20));
  it("冒用 gov 字样 + 高风险后缀", () => assert.ok(checkUrl("yibao-gov-cn.top").riskScore >= 50));
  it("编辑距离仿冒", () => assert.equal(checkUrl("https://icbc.com.cm").imitating ?? checkUrl("https://1cbc.com.cn").imitating, "icbc.com.cn"));
  it("IP 直连", () => assert.ok(checkUrl("http://192.168.1.10/login").tags.includes("IP 地址直连")));
});

describe("RAG 检索", () => {
  it("知识库数据完整", () => {
    assert.ok(CASES.length >= 40 && KNOWLEDGE.length >= 30);
    for (const t of FRAUD_TYPE_KEYS) assert.ok(CASES.filter((c) => c.type === t).length >= 3, t);
  });
  it("中文 bigram 分词", () => assert.ok(tokenize("安全账户").includes("账户")));
  it("BM25 检索命中同类案例", async () => {
    const { docs } = await hybridSearch("自称警察说我涉嫌洗钱让我转到安全账户", { topK: 3, kind: "case" });
    assert.ok(docs.some((d) => d.fraudType === "impersonate_police"));
  });
});

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

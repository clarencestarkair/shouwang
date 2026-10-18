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

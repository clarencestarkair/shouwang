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

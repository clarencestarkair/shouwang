/**
 * 预计算 RAG 向量索引：pnpm rag:build
 * 读取 data/cases.json + data/knowledge.json，调用向量模型，输出 data/embeddings.json。
 * 运行时检索只需对查询做一次向量化，文档向量全部离线完成，降低延迟与成本。
 */
import fs from "node:fs";
import path from "node:path";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embedMany } from "ai";
import { DOCS } from "../src/lib/core/rag";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {}
}

const baseURL = process.env.EMBEDDING_BASE_URL || process.env.LLM_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const apiKey = process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY;
const modelId = process.env.EMBEDDING_MODEL || "text-embedding-v3";

if (!apiKey) {
  console.error("缺少 LLM_API_KEY / EMBEDDING_API_KEY，请先配置 .env.local");
  process.exit(1);
}

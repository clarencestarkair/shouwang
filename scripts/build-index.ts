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

const model = createOpenAICompatible({ name: "embedding", baseURL, apiKey }).embeddingModel(modelId);
const BATCH = 10; // 兼容 DashScope 等单次最多 10 条的限制

async function main() {
  const vectors: Record<string, number[]> = {};
  for (let i = 0; i < DOCS.length; i += BATCH) {
    const batch = DOCS.slice(i, i + BATCH);
    const { embeddings } = await embedMany({ model, values: batch.map((d) => d.text.slice(0, 2000)), maxRetries: 2 });
    batch.forEach((d, j) => (vectors[d.id] = embeddings[j].map((x) => Number(x.toFixed(6)))));
    process.stdout.write(`\r已向量化 ${Math.min(i + BATCH, DOCS.length)}/${DOCS.length}`);
  }
  const dim = Object.values(vectors)[0]?.length ?? 0;
  const out = path.join(process.cwd(), "data", "embeddings.json");
  fs.writeFileSync(out, JSON.stringify({ model: modelId, dim, vectors }));
  console.log(`\n完成：${DOCS.length} 条文档，维度 ${dim}，写入 ${out}`);
}

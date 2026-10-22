/**
 * 模型接入层：统一使用 OpenAI 兼容协议，可在通义千问 / DeepSeek / 智谱 / 硅基流动等之间切换。
 * 文本、视觉、向量三类模型可分别配置不同服务商（例如文本用 DeepSeek，视觉用通义千问 VL）。
 */
import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed } from "ai";

function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : fallback;
}

function makeProvider(name: string, baseURL: string, apiKey?: string) {
  return createOpenAICompatible({ name, baseURL, apiKey, includeUsage: true });
}

const textProvider = makeProvider("llm", base.baseURL, base.apiKey);
const visionProvider = makeProvider("vision", env("VISION_BASE_URL", base.baseURL)!, env("VISION_API_KEY", base.apiKey));
const embeddingProvider = makeProvider("embedding", env("EMBEDDING_BASE_URL", base.baseURL)!, env("EMBEDDING_API_KEY", base.apiKey));

export const modelConfig = {
  text: env("LLM_MODEL", "qwen-plus")!,
  vision: env("VISION_MODEL", "qwen-vl-max")!,
  embedding: env("EMBEDDING_MODEL", "text-embedding-v3")!,
};

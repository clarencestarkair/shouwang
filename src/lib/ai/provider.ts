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

/** 运行状态：前端据此提示“AI 模式 / 兜底模式”，并展示当前模型配置 */
import { aiStatus, modelConfig } from "@/lib/ai/provider";
import { loadEmbeddingIndex, DOCS } from "@/lib/core/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

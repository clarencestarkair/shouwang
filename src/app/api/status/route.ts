/** 运行状态：前端据此提示“AI 模式 / 兜底模式”，并展示当前模型配置 */
import { aiStatus, modelConfig } from "@/lib/ai/provider";
import { loadEmbeddingIndex, DOCS } from "@/lib/core/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = aiStatus();
  return Response.json({
    ai: s,
    models: { text: s.text ? modelConfig.text : null, vision: s.vision ? modelConfig.vision : null, embedding: s.embedding ? modelConfig.embedding : null },
    rag: { docs: DOCS.length, vectorIndex: Boolean(loadEmbeddingIndex()) },
  });
}

/** 案例库检索接口：供案例库页面和调试使用，返回混合检索结果及命中通道 */
import { hybridSearch, CASES } from "@/lib/core/rag";
import { aiStatus, embedQuery } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 200);
  if (!q) return Response.json({ cases: CASES });
  const res = await hybridSearch(q, { topK: 8, embedQuery: aiStatus().embedding ? embedQuery : undefined });
  return Response.json(res);
}

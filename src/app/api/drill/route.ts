/**
 * 反诈演练：AI 扮演骗子（剧本来自 RAG 案例库），老人在安全环境中练习识破骗局。
 * 角色扮演受系统提示严格约束：不使用真实机构网址/号码，识破或泄露时自动结束并讲解。
 */
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { aiStatus, sampling, textModel } from "@/lib/ai/provider";
import { drillSystem } from "@/lib/ai/prompts";
import { getCase } from "@/lib/core/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ caseId: z.string(), messages: z.array(z.any()).min(1).max(40) });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return new Response("bad request", { status: 400 });
  const c = getCase(parsed.data.caseId);
  if (!c) return new Response("case not found", { status: 404 });
  if (!aiStatus().text) return new Response("演练需要配置大模型", { status: 503 });

  const messages = parsed.data.messages as UIMessage[];
  const result = streamText({
    model: textModel(),
    system: drillSystem(c),
    // 首轮客户端发送“【开始演练】”，由骗子开场
    messages: await convertToModelMessages(messages),
    ...sampling(0.8),
    maxRetries: 1,
  });
  return result.toUIMessageStreamResponse();
}

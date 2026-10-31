/** 演练复盘：AI 教练对整场对话评分，输出结构化点评 */
import { generateText } from "ai";
import { z } from "zod";
import { aiStatus, sampling, textModel } from "@/lib/ai/provider";
import { DRILL_REVIEW_PROMPT } from "@/lib/ai/prompts";
import { getCase } from "@/lib/core/rag";
import { extractJson } from "@/lib/ai/json";
import { drillReviewSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  caseId: z.string(),
  transcript: z.array(z.object({ role: z.enum(["scammer", "learner"]), text: z.string().max(2000) })).max(40),
});


export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "参数错误" }, { status: 400 });
  const c = getCase(parsed.data.caseId);
  if (!c || !aiStatus().text) return Response.json({ error: "不可用" }, { status: 503 });

  const transcript = parsed.data.transcript.map((t) => `${t.role === "scammer" ? "骗子" : "学员"}：${t.text}`).join("\n");
  const { text } = await generateText({
    model: textModel(),
    system: DRILL_REVIEW_PROMPT,
    prompt: `骗局类型：${c.title}\n该骗局的破绽：${c.redFlags.join("；")}\n\n对话记录：\n${transcript}`,
    ...sampling(0.2),
    maxRetries: 1,
  });
  const review = extractJson(text, drillReviewSchema);
  if (!review) return Response.json({ error: "点评生成失败，请重试" }, { status: 502 });
  return Response.json({ review });
}

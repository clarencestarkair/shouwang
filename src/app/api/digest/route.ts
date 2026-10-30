/**
 * AI 守护周报：统计某位家人近 7 天的检测记录，由大模型写给子女的周报与建议。
 * 结果按“家人 + 记录数”缓存，避免每次打开看板都调用模型；模型不可用时用模板兜底。
 */
import { generateText } from "ai";
import { z } from "zod";
import { aiStatus, sampling, textModel } from "@/lib/ai/provider";
import { extractJson } from "@/lib/ai/json";
import { listAlerts } from "@/lib/store/alerts";
import { FRAUD_TYPES, levelRank } from "@/lib/core/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const digestSchema = z.object({ summary: z.string(), suggestions: z.array(z.string()).min(1).max(3) });
type Digest = z.infer<typeof digestSchema> & { generatedBy: "ai" | "template" };

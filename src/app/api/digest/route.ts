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

const g = globalThis as unknown as { __digestCache?: Map<string, Digest> };
const cache = (g.__digestCache ??= new Map());

export async function POST(req: Request) {
  const { elderName } = z.object({ elderName: z.string().max(10) }).parse(await req.json());
  const since = Date.now() - 7 * 86400e3;
  const rows = listAlerts().filter((a) => a.elderName === elderName && a.createdAt >= since);
  const risky = rows.filter((a) => levelRank(a.level) >= 3);
  const types = new Map<string, number>();
  for (const a of risky) if (a.fraudType !== "none" && a.fraudType !== "unknown") types.set(FRAUD_TYPES[a.fraudType], (types.get(FRAUD_TYPES[a.fraudType]) ?? 0) + 1);
  const topTypes = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const hours = risky.map((a) => new Date(a.createdAt).getHours());
  const evening = hours.filter((h) => h >= 18).length;
  const pending = rows.filter((a) => isFinite(a.score) && levelRank(a.level) >= 3 && a.status !== "handled").length;

  const stats = { total: rows.length, risky: risky.length, pending, topTypes, eveningShare: risky.length ? Math.round((evening / risky.length) * 100) : 0 };
  const key = `${elderName}:${rows.length}:${pending}`;
  if (cache.has(key)) return Response.json({ stats, digest: cache.get(key) });

  const template: Digest = {
    summary: rows.length
      ? `这一周守望帮${elderName}看了 ${stats.total} 条消息，其中 ${stats.risky} 条是高风险骗局${topTypes.length ? `，最多的是「${topTypes[0][0]}」` : ""}。${pending ? `还有 ${pending} 条没有沟通过。` : "所有高风险提醒都已处理。"}`
      : `这一周${elderName}没有提交需要判断的消息。`,
    suggestions: [topTypes.length ? `和${elderName}聊聊「${topTypes[0][0]}」的套路，用最近的真实例子讲。` : `周末陪${elderName}做一次反诈演练。`, "约定一个家庭“暗号”，凡是借钱先对暗号。"],
    generatedBy: "template",
  };

/**
 * 稳健的 JSON 抽取：兼容不同服务商对结构化输出支持程度的差异，
 * 从模型输出中提取第一个 JSON 对象并用 zod 校验，失败返回 null（由调用方兜底）。
 */
import type { z } from "zod";

export function extractJson<T extends z.ZodTypeAny>(text: string, schema: T): z.infer<T> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(candidate.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

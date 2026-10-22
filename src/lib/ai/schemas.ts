/** 前后端共享的结构化输出 schema */
import { z } from "zod";

export const drillReviewSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.string(),
  goodMoves: z.array(z.string()),
  mistakes: z.array(z.string()),
  keyLessons: z.array(z.string()),
});

export type DrillReview = z.infer<typeof drillReviewSchema>;

/** 演练复盘：AI 教练对整场对话评分，输出结构化点评 */
import { generateText } from "ai";
import { z } from "zod";
import { aiStatus, sampling, textModel } from "@/lib/ai/provider";
import { DRILL_REVIEW_PROMPT } from "@/lib/ai/prompts";
import { getCase } from "@/lib/core/rag";
import { extractJson } from "@/lib/ai/json";
import { drillReviewSchema } from "@/lib/ai/schemas";

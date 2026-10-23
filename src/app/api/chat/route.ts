/**
 * 守望 · 多智能体反诈分析流水线
 *
 *   ① 端侧预处理（浏览器完成）：PII 脱敏、二维码解析、图片压缩
 *   ② 感知 Agent：视觉大模型识别截图/照片中的文字与可疑细节
 *   ③ 规则引擎初筛：可解释风险信号 + 实体抽取 + 提示词注入检测
 *   ④ 研判 Agent：检索案例(RAG) → 核验号码/链接(Tool) → 提交结构化报告
 *   ⑤ 安全审查：双通道校验、危险建议过滤、高风险兜底动作、家属通知
 *
 * 全程以 UI Message Stream 流式推送，前端实时展示每个阶段的“思考过程”。
 */
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  stepCountIs,
  streamText,
  type ModelMessage,
} from "ai";
import { aiStatus, embedQuery, modelConfig, sampling, textModel, visionModel } from "@/lib/ai/provider";
import { GUARDIAN_SYSTEM, FAMILY_ADVICE_HINT, PERCEPTION_PROMPT } from "@/lib/ai/prompts";
import { createGuardianTools } from "@/lib/ai/tools";
import type { GuardianRequestBody, GuardianUIMessage, PerceptionData, TraceData } from "@/lib/ai/messages";
import { detectChannel, extractEntities, scanText } from "@/lib/core/rules";
import { detectInjection, maskPII, wrapUntrusted } from "@/lib/core/safety";
import { hybridSearch } from "@/lib/core/rag";
import { buildFallbackReport } from "@/lib/core/fallback";
import { addAlert } from "@/lib/store/alerts";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGES = 3;

function parseDataUrl(url: string): { mediaType: string; data: string } | null {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  return m ? { mediaType: m[1], data: m[2] } : null;
}

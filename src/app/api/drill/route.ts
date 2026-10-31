/**
 * 反诈演练：AI 扮演骗子（剧本来自 RAG 案例库），老人在安全环境中练习识破骗局。
 * 角色扮演受系统提示严格约束：不使用真实机构网址/号码，识破或泄露时自动结束并讲解。
 */
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { aiStatus, sampling, textModel } from "@/lib/ai/provider";
import { drillSystem } from "@/lib/ai/prompts";
import { getCase } from "@/lib/core/rag";

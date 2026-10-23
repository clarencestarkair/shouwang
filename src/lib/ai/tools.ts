/**
 * 守望 Agent 的工具集（Function Calling）。
 *
 * 工具的业务逻辑全部来自 src/lib/core（纯函数），
 * 与 mcp-server 暴露的 MCP 工具共享同一份实现，保证 Web 端与 MCP 客户端行为一致。
 */
import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { checkPhone } from "@/lib/core/phone";
import { checkUrl } from "@/lib/core/url";
import { hybridSearch } from "@/lib/core/rag";
import { guardReport, maskPII } from "@/lib/core/safety";
import { FRAUD_TYPE_KEYS, type RiskReport } from "@/lib/core/types";
import { addAlert } from "@/lib/store/alerts";
import { aiStatus, embedQuery } from "./provider";

export const riskReportSchema = z.object({
  level: z.enum(["safe", "low", "medium", "high", "critical"]).describe("风险等级：safe/low/medium/high/critical"),
  score: z.number().min(0).max(100).describe("风险分 0-100"),
  fraudType: z.enum([...FRAUD_TYPE_KEYS, "none", "unknown"]).describe("诈骗类型"),
  headline: z.string().max(40).describe("一句话结论，给老人看的大字，20字以内"),
  reasons: z
    .array(z.object({ point: z.string().describe("大白话解释"), evidence: z.string().describe("原文中的证据片段") }))
    .min(1)
    .max(4)
    .describe("判断理由，每条都要有原文证据"),
  actions: z.array(z.string()).min(1).max(4).describe("老人现在该做的事，按优先级排序，每条一句"),
  citedCases: z.array(z.string()).describe("参考的案例 id"),
  notifyFamily: z.boolean().describe("是否需要通知家属（高风险必须 true）"),
  familyAdvice: z.string().optional().describe("给子女的沟通建议：不责备、先共情、教具体方法"),
  shortVerdict: z.string().max(6).describe("整屏大字的行动指令，2~4 个字，如“别转钱”“别点链接”“先别信”“放心”"),
  scamStage: z.number().int().min(0).max(4).describe("骗局进行到第几步：0 非诈骗；1 冒充身份建立信任；2 制造恐慌或诱惑；3 要求保密、隔离（不让告诉家人/屏幕共享/下载App）；4 要钱或要验证码"),
  nextMove: z.string().optional().describe("预判骗子下一步很可能让老人做什么（一句话，用于提前预警）；非诈骗可省略"),
});

export interface ToolContext {
  elderName: string;
  ruleScore: number;
  injectionSuspicious: boolean;
  /** 本轮被分析内容（已脱敏），用于家属端预览 */
  contentPreview: string;
  channel: import("@/lib/core/types").Channel;
}

export function createGuardianTools(ctx: ToolContext) {
  return {
    searchFraudCases: tool({
      description: "在反诈案例库和知识库中做混合检索（关键词+语义），返回最相似的诈骗案例与反诈常识。",
      inputSchema: z.object({
        query: z.string().describe("检索语句，用内容中的关键说法，如“自称警察 安全账户 保密”"),
        kind: z.enum(["all", "case", "knowledge"]).default("all"),
      }),
      execute: async ({ query, kind }) => {
        const res = await hybridSearch(query, {
          topK: 4,
          kind,
          embedQuery: aiStatus().embedding ? embedQuery : undefined,
        });
        return {
          channels: res.channels,
          results: res.docs.map((d) => ({ ...d, snippet: d.snippet.slice(0, 360) })),
        };
      },
    }),

    checkUrl: tool({
      description: "核验网址风险：仿冒官方域名、高风险后缀、IP直连、短链接、同形字域名。",
      inputSchema: z.object({ url: z.string().describe("网址原文") }),
      execute: async ({ url }) => checkUrl(url),
    }),

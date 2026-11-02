/**
 * 守望 MCP Server（Model Context Protocol）
 *
 * 把反诈能力以标准 MCP 工具形式开放，任何支持 MCP 的 AI 客户端
 * （Claude Desktop、Cursor、Cherry Studio 等）都能直接接入：
 *   - search_fraud_cases：反诈案例/知识混合检索（RAG）
 *   - check_phone_number：号码风险核验
 *   - check_url：链接仿冒核验
 *   - scan_text_risk：规则引擎风险扫描 + 提示词注入检测
 * 资源：
 *   - shouwang://cases/{id}：单个案例详情
 *
 * 与 Web 端 Agent 共用 src/lib/core 中的同一套实现（只使用相对路径，便于 tsx 独立运行）。
 */
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkPhone } from "../core/phone";
import { checkUrl } from "../core/url";
import { extractEntities, scanText } from "../core/rules";
import { detectInjection, maskPII } from "../core/safety";
import { CASES, getCase, hybridSearch } from "../core/rag";

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

export function createShouwangMcpServer(opts: { embedQuery?: (q: string) => Promise<number[]> } = {}) {
  const server = new McpServer({ name: "shouwang-anti-fraud", version: "1.0.0" });

  server.registerTool(
    "search_fraud_cases",
    {
      title: "反诈案例检索",
      description: "在守望反诈案例库与知识库中做混合检索（BM25 + 向量，RRF 融合），返回最相似的诈骗案例与反诈常识。",
      inputSchema: {
        query: z.string().describe("检索语句，如“自称警察 安全账户 保密”"),
        topK: z.number().int().min(1).max(10).default(4),
        kind: z.enum(["all", "case", "knowledge"]).default("all"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, topK, kind }) => json(await hybridSearch(query, { topK, kind, embedQuery: opts.embedQuery })),
  );

  server.registerTool(
    "check_phone_number",
    {
      title: "号码风险核验",
      description: "识别境外号、虚拟号段、仿冒银行/政务客服号，返回风险分与解释。",
      inputSchema: { phone: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ phone }) => json(checkPhone(phone)),
  );

  server.registerTool(
    "check_url",
    {
      title: "链接仿冒核验",
      description: "检测仿冒官方域名（编辑距离/关键词嵌入）、高风险后缀、IP 直连、短链、同形字域名。",
      inputSchema: { url: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ url }) => json(checkUrl(url)),
  );

  server.registerTool(
    "scan_text_risk",
    {
      title: "文本风险扫描",
      description: "对短信/聊天/通话转写做规则引擎扫描：风险信号、风险分、可能的诈骗类型、号码链接抽取、提示词注入检测。输入会先脱敏。",
      inputSchema: { text: z.string().max(5000) },
      annotations: { readOnlyHint: true },
    },
    async ({ text }) => {
      const masked = maskPII(text).text;
      return json({ ...scanText(masked), entities: extractEntities(masked), injection: detectInjection(masked) });
    },
  );

  server.registerResource(
    "fraud-case",
    new ResourceTemplate("shouwang://cases/{id}", {
      list: async () => ({ resources: CASES.map((c) => ({ uri: `shouwang://cases/${c.id}`, name: c.title, mimeType: "application/json" })) }),
    }),
    { title: "反诈案例", description: "守望案例库中的单个典型诈骗案例", mimeType: "application/json" },
    async (uri, { id }) => {
      const c = getCase(String(id));
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(c ?? { error: "not found" }, null, 2) }] };
    },
  );

  return server;
}

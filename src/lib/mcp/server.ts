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

  return server;
}

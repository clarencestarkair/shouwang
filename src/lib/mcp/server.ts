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

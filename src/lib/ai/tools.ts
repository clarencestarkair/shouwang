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

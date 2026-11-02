/**
 * MCP over Streamable HTTP（无状态模式）。
 * 部署后任何 MCP 客户端可通过 https://<域名>/api/mcp 远程使用守望的反诈工具。
 */
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createShouwangMcpServer } from "@/lib/mcp/server";
import { aiStatus, embedQuery } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const server = createShouwangMcpServer({ embedQuery: aiStatus().embedding ? embedQuery : undefined });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}

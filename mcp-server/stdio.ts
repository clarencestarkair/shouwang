/**
 * 以 stdio 方式运行守望 MCP Server，供本地 MCP 客户端接入：
 *   pnpm mcp
 * Claude Desktop 配置示例见 README。
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createShouwangMcpServer } from "../src/lib/mcp/server";

async function main() {
  const server = createShouwangMcpServer();
  await server.connect(new StdioServerTransport());
  console.error("[shouwang-mcp] ready on stdio");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

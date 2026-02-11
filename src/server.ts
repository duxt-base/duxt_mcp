import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources } from "./resources.js";
import { registerTools } from "./tools.js";
import { registerPrompts } from "./prompts.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "duxt-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  return server;
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllDocs, getDoc } from "./docs-loader.js";

export function registerResources(server: McpServer): void {
  server.resource(
    "duxt-docs",
    "duxt://docs/{section}/{slug}",
    {
      description: "Duxt framework documentation pages",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const doc = getDoc(uri.href);
      if (!doc) {
        throw new Error(`Document not found: ${uri.href}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: doc.content,
          },
        ],
      };
    }
  );
}

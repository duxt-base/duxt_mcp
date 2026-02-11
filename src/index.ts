import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import { loadDocs, getAllDocs } from "./docs-loader.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Load docs at startup
loadDocs();

const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  const docs = getAllDocs();
  res.json({
    status: "ok",
    server: "duxt-mcp",
    version: "0.1.0",
    docs: docs.length,
  });
});

// MCP endpoint — stateless, JSON responses, no auth
app.post("/mcp", async (req, res) => {
  // Each request gets a fresh transport+server (stateless)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
    enableJsonResponse: true, // JSON instead of SSE
  });

  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  // Clean up after response
  await server.close();
});

app.get("/mcp", async (req, res) => {
  // Stateless server doesn't support GET SSE streams
  res.status(405).json({ error: "Method not allowed. Use POST." });
});

app.delete("/mcp", async (req, res) => {
  // Stateless server doesn't support DELETE
  res.status(405).json({ error: "Method not allowed. Stateless server." });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const docs = getAllDocs();
  console.log(`duxt-mcp server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  MCP:    http://localhost:${PORT}/mcp`);
  console.log(`  Docs loaded: ${docs.length}`);
});

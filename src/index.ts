import express from "express";
import { randomUUID } from "node:crypto";
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

// Store active transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

// MCP endpoint — handles POST, GET, DELETE
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Reuse existing transport for the session
  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — create transport and connect server
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      transports.delete(transport.sessionId);
    }
  };

  const server = createMcpServer();
  await server.connect(transport);

  if (transport.sessionId) {
    transports.set(transport.sessionId, transport);
  }

  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session. Send a POST to /mcp first." });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session." });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  const docs = getAllDocs();
  console.log(`duxt-mcp server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  MCP:    http://localhost:${PORT}/mcp`);
  console.log(`  Docs loaded: ${docs.length}`);
});

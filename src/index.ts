import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import { loadDocs, getAllDocs } from "./docs-loader.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Load docs at startup
loadDocs();

const app = express();
app.use(express.json());

// Landing page
app.get("/", (_req, res) => {
  const docs = getAllDocs();
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Duxt MCP Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 680px; padding: 3rem 2rem; text-align: center; }
    .logo { margin-bottom: 0.75rem; }
    .logo svg { width: 160px; height: auto; }
    .badge { display: inline-block; background: #164e63; color: #22d3ee; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 9999px; margin-bottom: 0.75rem; letter-spacing: 0.03em; }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; color: #f1f5f9; }
    .subtitle { color: #94a3b8; margin-bottom: 2.5rem; line-height: 1.6; }
    .stats { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2.5rem; }
    .stat { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1rem 1.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #22d3ee; }
    .stat-label { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }
    .setup { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; text-align: left; margin-bottom: 1rem; }
    .setup h3 { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .code-wrap { position: relative; }
    code { background: #0f172a; color: #22d3ee; padding: 0.6rem 2.5rem 0.6rem 1rem; border-radius: 8px; display: block; font-size: 0.85rem; overflow-x: auto; white-space: nowrap; }
    .copy-btn { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: color 0.2s; }
    .copy-btn:hover { color: #22d3ee; }
    .copy-btn.copied { color: #22c55e; }
    .editors { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 2rem; }
    .editor-card { background: #1e293b; border: 1px solid #334155; border-left: 3px solid #334155; border-radius: 12px; padding: 1.25rem; text-align: left; }
    .editor-card.claude { border-left-color: #d97757; background: linear-gradient(135deg, #1e293b 0%, #2a1f1a 100%); }
    .editor-card.cursor { border-left-color: #22d3ee; background: linear-gradient(135deg, #1e293b 0%, #172333 100%); }
    .editor-card.windsurf { border-left-color: #3b82f6; background: linear-gradient(135deg, #1e293b 0%, #1a2035 100%); }
    .editor-card.vscode { border-left-color: #0078d4; background: linear-gradient(135deg, #1e293b 0%, #1a2233 100%); }
    .editor-card h4 { font-size: 0.85rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.5rem; }
    .editor-card p { font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; }
    .editor-card code { font-size: 0.78rem; padding: 0.4rem 0.75rem; }
    .links { display: flex; justify-content: center; gap: 1.5rem; }
    .links a { color: #22d3ee; text-decoration: none; font-size: 0.9rem; }
    .links a:hover { text-decoration: underline; }
    @media (max-width: 500px) { .editors { grid-template-columns: 1fr; } .stats { gap: 1rem; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg viewBox="0 0 268 124" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M189.192 116C191.402 116 193.192 117.791 193.192 120C193.192 122.209 191.402 124 189.192 124H105.192C102.983 124 101.192 122.209 101.192 120C101.192 117.791 102.983 116 105.192 116H189.192ZM140.097 30C141.547 30.0001 142.742 30.4696 143.681 31.4082C144.619 32.2615 145.089 33.4137 145.089 34.8643V95.0244C145.089 96.5602 144.619 97.7977 143.681 98.7363C142.742 99.5896 141.547 100.016 140.097 100.016C138.646 100.016 137.451 99.5895 136.513 98.7363C135.659 97.7977 135.232 96.5602 135.232 95.0244V90.6582C132.971 93.2658 130.242 95.4481 127.04 97.2002C122.518 99.5894 117.483 100.784 111.937 100.784C105.878 100.784 100.459 99.5468 95.6807 97.0723C90.902 94.5123 87.1041 90.7995 84.2881 85.9355C81.5576 81.0716 80.1924 75.1407 80.1924 68.1436V34.8643C80.1924 33.4989 80.6619 32.3469 81.6006 31.4082C82.5393 30.4695 83.6913 30 85.0566 30C86.5072 30.0001 87.702 30.4696 88.6406 31.4082C89.5791 32.3468 90.0488 33.499 90.0488 34.8643V68.1436C90.0488 73.4342 91.0295 77.7869 92.9922 81.2002C95.0402 84.6135 97.7713 87.1732 101.185 88.8799C104.683 90.5865 108.608 91.4404 112.96 91.4404C117.141 91.4404 120.897 90.6291 124.225 89.0078C127.638 87.3865 130.325 85.1675 132.288 82.3516C134.128 79.7117 135.106 76.7347 135.221 73.4199L135.232 72.752V34.8643C135.232 33.4136 135.659 32.2615 136.513 31.4082C137.451 30.4696 138.646 30 140.097 30ZM66.1768 0C67.6273 5.75914e-05 68.8221 0.469596 69.7607 1.4082C70.6993 2.26152 71.1689 3.45632 71.1689 4.99219V65.4082C70.9983 72.0641 69.334 78.0801 66.1768 83.4561C63.1048 88.7466 58.8807 92.928 53.5049 96C48.2143 99.0719 42.2408 100.608 35.585 100.608C28.8436 100.608 22.7842 99.072 17.4082 96C12.0323 92.8427 7.76568 88.5761 4.6084 83.2002C1.53647 77.8243 7.32421e-05 71.723 0 64.8965C0 58.1552 1.4938 52.0957 4.48047 46.7197C7.55246 41.3438 11.6912 37.1198 16.8965 34.0479C22.1018 30.8905 27.9899 29.3115 34.5605 29.3115C40.2779 29.3115 45.4408 30.5498 50.0488 33.0244C54.6566 35.4137 58.3687 38.6135 61.1846 42.624V4.99219C61.1846 3.45619 61.6541 2.26154 62.5928 1.4082C63.5314 0.469564 64.7261 0 66.1768 0ZM260.312 32.832C261.592 32.8321 262.659 33.259 263.513 34.1123C264.366 34.8802 264.792 35.9039 264.792 37.1836C264.792 38.3782 264.366 39.4026 263.513 40.2559C262.659 41.0238 261.592 41.4082 260.312 41.4082H245.849V75.584C245.849 79.936 247.128 83.5199 249.688 86.3359C252.248 89.0665 255.533 90.4315 259.544 90.4316H263C264.365 90.4316 265.475 90.9013 266.328 91.8398C267.181 92.7785 267.608 93.9732 267.608 95.4238C267.608 96.8745 267.096 98.0691 266.072 99.0078C265.048 99.8611 263.768 100.288 262.232 100.288H259.544C255.022 100.288 250.969 99.2211 247.385 97.0879C243.886 94.9546 241.112 92.0531 239.064 88.3838C237.017 84.6292 235.992 80.3626 235.992 75.584V41.4082H227.673C226.393 41.4082 225.326 41.0238 224.473 40.2559C223.619 39.4025 223.192 38.3783 223.192 37.1836C223.192 35.9038 223.619 34.8802 224.473 34.1123C225.326 33.259 226.393 32.832 227.673 32.832H260.312Z" fill="#00C0E8"/>
      </svg>
    </div>
    <span class="badge">MCP Server</span>
    <h1>AI-Powered Framework Knowledge</h1>
    <p class="subtitle">Give Claude Code, Cursor, Windsurf, and other AI tools full access to Duxt framework documentation, code generation, and CLI helpers.</p>
    <div class="stats">
      <div class="stat"><div class="stat-value">${docs.length}</div><div class="stat-label">Docs</div></div>
      <div class="stat"><div class="stat-value">5</div><div class="stat-label">Tools</div></div>
      <div class="stat"><div class="stat-value">3</div><div class="stat-label">Prompts</div></div>
    </div>
    <div class="setup">
      <h3>Claude Code (Terminal)</h3>
      <div class="code-wrap">
        <code id="cc-cmd">claude mcp add duxt --transport http https://mcp.duxt.dev/mcp</code>
        <button class="copy-btn" onclick="copyText('cc-cmd')" title="Copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </div>
    <div class="editors">
      <div class="editor-card claude">
        <h4>Claude Desktop</h4>
        <p>Add to claude_desktop_config.json</p>
        <div class="code-wrap">
          <code id="cd-cfg">{ "mcpServers": { "duxt": { "url": "https://mcp.duxt.dev/mcp" } } }</code>
          <button class="copy-btn" onclick="copyText('cd-cfg')" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="editor-card cursor">
        <h4>Cursor</h4>
        <p>Add to .cursor/mcp.json</p>
        <div class="code-wrap">
          <code id="cur-cfg">{ "mcpServers": { "duxt": { "url": "https://mcp.duxt.dev/mcp" } } }</code>
          <button class="copy-btn" onclick="copyText('cur-cfg')" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="editor-card windsurf">
        <h4>Windsurf</h4>
        <p>Add to ~/.codeium/windsurf/mcp_config.json</p>
        <div class="code-wrap">
          <code id="ws-cfg">{ "mcpServers": { "duxt": { "serverUrl": "https://mcp.duxt.dev/mcp" } } }</code>
          <button class="copy-btn" onclick="copyText('ws-cfg')" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="editor-card vscode">
        <h4>VS Code + Copilot</h4>
        <p>Add to .vscode/mcp.json</p>
        <div class="code-wrap">
          <code id="vs-cfg">{ "servers": { "duxt": { "type": "http", "url": "https://mcp.duxt.dev/mcp" } } }</code>
          <button class="copy-btn" onclick="copyText('vs-cfg')" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="links">
      <a href="https://duxt.dev">Duxt Docs</a>
      <a href="https://github.com/duxt-base/duxt_mcp">GitHub</a>
      <a href="/health">Health Check</a>
    </div>
  </div>
  <script>
    function copyText(id) {
      const el = document.getElementById(id);
      navigator.clipboard.writeText(el.textContent.trim());
      const btn = el.parentElement.querySelector('.copy-btn');
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1500);
    }
  </script>
</body>
</html>`);
});

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

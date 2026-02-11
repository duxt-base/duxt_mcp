# duxt-mcp

Hosted MCP server for the Duxt framework. Gives AI tools (Claude Code, Claude Desktop, Cursor, etc.) full knowledge of Duxt, duxt_orm, duxt_html, duxt_signals, and duxt_icons.

Live at **https://mcp.duxt.dev/mcp**

## Setup

Add to your AI tool's MCP configuration:

### Claude Code

```
claude mcp add duxt --transport http https://mcp.duxt.dev/mcp
```

### Claude Desktop / Cursor / Other

Add to your MCP config file:

```json
{
  "mcpServers": {
    "duxt": {
      "url": "https://mcp.duxt.dev/mcp"
    }
  }
}
```

## What's Included

### 50 Documentation Resources

All Duxt framework docs available as MCP resources:

| Section | Docs | Topics |
|---------|------|--------|
| duxt | 15 | routing, modules, pages, layouts, state, middleware, server, deploy, security |
| duxt-cli | 9 | create, dev, build, scaffold, generators, utilities |
| duxt-orm | 7 | models, schema, queries, relations, transactions |
| duxt-html | 5 | components, getting-started, examples, api-reference |
| duxt-signals | 7 | signals, computed, effects, forms, examples |
| duxt-icons | 6 | icon-component, providers, caching, api-reference |
| tutorials | 1 | build a blog |

### 5 Tools

- **search_docs** — Full-text search across all Duxt docs
- **get_component_api** — Look up a specific component's API (duxt_html, duxt_icons)
- **generate_code** — Generate Duxt code (model, page, component, api route, layout)
- **duxt_cli_help** — Get the right CLI command for a task
- **get_project_structure** — Show project directory structure (static, server, client)

### 3 Prompts

- **create-page** — Step-by-step guide for creating a Duxt page
- **create-model** — Guide for creating an ORM model with schema and relations
- **scaffold-crud** — Full CRUD scaffolding guide (model, API, pages, form)

## Development

```
npm install
npm run dev
```

Server starts on http://localhost:3000. Health check at http://localhost:3000/health.

### Updating docs

Docs are copied from `duxt_docs` at build time:

```
npm run copy-docs
```

## Deploy

```
bash deploy.sh
```

Deploys to Basepod as `duxt-mcp` app at https://mcp.duxt.dev.

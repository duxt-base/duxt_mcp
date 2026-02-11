import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchDocs, getDocsBySection, getAllDocs } from "./docs-loader.js";

export function registerTools(server: McpServer): void {
  // 1. search_docs — Full-text search across all docs
  server.tool(
    "search_docs",
    "Search Duxt framework documentation. Returns matching pages with relevance scores.",
    {
      query: z.string().describe("Search query (e.g. 'routing middleware', 'ORM relations')"),
      maxResults: z.number().optional().default(10).describe("Maximum number of results to return"),
    },
    async ({ query, maxResults }) => {
      const results = searchDocs(query, maxResults);

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No results found for "${query}". Try broader terms like "routing", "orm", "components", "signals", or "cli".`,
            },
          ],
        };
      }

      const formatted = results.map((r, i) => {
        const preview = r.content.slice(0, 200).replace(/\n/g, " ").trim();
        return `${i + 1}. **${r.title}** (score: ${r.score})\n   URI: ${r.uri}\n   Section: ${r.section}\n   ${preview}...`;
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${results.length} results for "${query}":\n\n${formatted.join("\n\n")}`,
          },
        ],
      };
    }
  );

  // 2. get_component_api — Look up a specific component
  server.tool(
    "get_component_api",
    "Look up API documentation for a specific Duxt component (from duxt_html, duxt_ui, or duxt_icons).",
    {
      name: z.string().describe("Component name (e.g. 'Button', 'Card', 'DuxtIcon', 'Section')"),
      package: z
        .enum(["duxt_html", "duxt_ui", "duxt_icons"])
        .describe("Which package the component belongs to"),
    },
    async ({ name, package: pkg }) => {
      const sectionMap: Record<string, string> = {
        duxt_html: "duxt-html",
        duxt_ui: "duxt-ui",
        duxt_icons: "duxt-icons",
      };
      const section = sectionMap[pkg];
      const docs = getDocsBySection(section);

      if (docs.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No documentation found for package "${pkg}". Available sections: duxt-html, duxt-icons.`,
            },
          ],
        };
      }

      // Search for the component name in all docs of that section
      const nameLower = name.toLowerCase();
      const matches: Array<{ doc: typeof docs[0]; excerpt: string }> = [];

      for (const doc of docs) {
        const lines = doc.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(nameLower)) {
            // Extract surrounding context (up to 30 lines)
            const start = Math.max(0, i - 2);
            const end = Math.min(lines.length, i + 28);
            matches.push({
              doc,
              excerpt: lines.slice(start, end).join("\n"),
            });
            break;
          }
        }
      }

      if (matches.length === 0) {
        // Return the full components/api-reference doc as fallback
        const apiDoc = docs.find(
          (d) => d.slug === "api-reference" || d.slug === "components"
        );
        return {
          content: [
            {
              type: "text" as const,
              text: apiDoc
                ? `Component "${name}" not found directly. Here's the full ${pkg} reference:\n\n${apiDoc.content}`
                : `Component "${name}" not found in ${pkg} documentation.`,
            },
          ],
        };
      }

      const text = matches
        .map((m) => `## From: ${m.doc.title} (${m.doc.uri})\n\n${m.excerpt}`)
        .join("\n\n---\n\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );

  // 3. generate_code — Generate Duxt code templates
  server.tool(
    "generate_code",
    "Generate ready-to-use Dart code following Duxt framework patterns.",
    {
      type: z
        .enum(["model", "page", "component", "api", "layout"])
        .describe("Type of code to generate"),
      name: z.string().describe("Name for the generated item (e.g. 'Post', 'HomePage', 'BlogLayout')"),
      fields: z
        .record(z.string(), z.string())
        .optional()
        .describe("Fields/properties as key-value pairs (e.g. {\"title\": \"String\", \"body\": \"String\"})"),
    },
    async ({ type, name, fields }) => {
      let code = "";

      switch (type) {
        case "model": {
          const fieldEntries = fields ? Object.entries(fields) : [];
          const schemaFields = fieldEntries
            .map(([k, v]) => `      '${k}': ColumnType.${dartToColumnType(v)},`)
            .join("\n");
          const classFields = fieldEntries
            .map(([k, v]) => `  ${v}? ${k};`)
            .join("\n");
          const fromMapFields = fieldEntries
            .map(([k, v]) => `    ${k} = map['${k}'] as ${v}?;`)
            .join("\n");
          const toMapFields = fieldEntries
            .map(([k]) => `      '${k}': ${k},`)
            .join("\n");

          code = `import 'package:duxt_orm/duxt_orm.dart';

class ${name} extends Model {
  @override
  String get tableName => '${toSnakeCase(name)}s';

  @override
  Map<String, ColumnType> get schema => {
${schemaFields}
  };

${classFields}

  @override
  void fromMap(Map<String, dynamic> map) {
    super.fromMap(map);
${fromMapFields}
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
${toMapFields}
    };
  }
}
`;
          break;
        }

        case "page": {
          code = `import 'package:jaspr/jaspr.dart';
import 'package:duxt_html/duxt_html.dart';

class ${name} extends StatelessComponent {
  @override
  Iterable<Component> build(BuildContext context) sync* {
    yield Section(
      className: 'container mx-auto py-8',
      children: [
        H1(
          className: 'text-3xl font-bold mb-4',
          child: Text('${splitCamelCase(name)}'),
        ),
        P(
          className: 'text-gray-600',
          child: Text('Welcome to the ${splitCamelCase(name).toLowerCase()}.'),
        ),
      ],
    );
  }
}
`;
          break;
        }

        case "component": {
          code = `import 'package:jaspr/jaspr.dart';
import 'package:duxt_html/duxt_html.dart';

class ${name} extends StatelessComponent {
  const ${name}({
    this.className,
    this.child,
  });

  final String? className;
  final Component? child;

  @override
  Iterable<Component> build(BuildContext context) sync* {
    yield Div(
      className: className ?? '',
      children: [
        if (child != null) child!,
      ],
    );
  }
}
`;
          break;
        }

        case "api": {
          code = `import 'package:duxt/duxt.dart';

void registerApi(DuxtServer server) {
  // GET /api/${toSnakeCase(name)}
  server.get('/api/${toSnakeCase(name)}', (req) async {
    return Response.json({'message': '${name} list'});
  });

  // POST /api/${toSnakeCase(name)}
  server.post('/api/${toSnakeCase(name)}', (req) async {
    final body = await req.body();
    return Response.json({'message': '${name} created', 'data': body});
  });

  // GET /api/${toSnakeCase(name)}/:id
  server.get('/api/${toSnakeCase(name)}/:id', (req) async {
    final id = req.params['id'];
    return Response.json({'message': '${name} detail', 'id': id});
  });

  // PUT /api/${toSnakeCase(name)}/:id
  server.put('/api/${toSnakeCase(name)}/:id', (req) async {
    final id = req.params['id'];
    final body = await req.body();
    return Response.json({'message': '${name} updated', 'id': id, 'data': body});
  });

  // DELETE /api/${toSnakeCase(name)}/:id
  server.delete('/api/${toSnakeCase(name)}/:id', (req) async {
    final id = req.params['id'];
    return Response.json({'message': '${name} deleted', 'id': id});
  });
}
`;
          break;
        }

        case "layout": {
          code = `import 'package:jaspr/jaspr.dart';
import 'package:duxt_html/duxt_html.dart';

class ${name} extends StatelessComponent {
  const ${name}({required this.child});

  final Component child;

  @override
  Iterable<Component> build(BuildContext context) sync* {
    yield Div(
      className: 'min-h-screen flex flex-col',
      children: [
        // Header
        Header(
          className: 'bg-white shadow-sm border-b',
          child: Nav(
            className: 'container mx-auto px-4 py-3 flex items-center justify-between',
            children: [
              A(href: '/', child: Text('My App')),
              Div(
                className: 'flex gap-4',
                children: [
                  A(href: '/', child: Text('Home')),
                  A(href: '/about', child: Text('About')),
                ],
              ),
            ],
          ),
        ),

        // Main content
        Main(
          className: 'flex-1',
          child: child,
        ),

        // Footer
        Footer(
          className: 'bg-gray-100 border-t py-6',
          child: Div(
            className: 'container mx-auto px-4 text-center text-gray-600',
            child: P(child: Text('Built with Duxt')),
          ),
        ),
      ],
    );
  }
}
`;
          break;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Generated ${type} code for "${name}":\n\n\`\`\`dart\n${code}\`\`\``,
          },
        ],
      };
    }
  );

  // 4. duxt_cli_help — Get the right CLI command for a task
  server.tool(
    "duxt_cli_help",
    "Get the right Duxt CLI command for a task. Describes exact commands, flags, and what they do.",
    {
      task: z.string().describe("What you want to do (e.g. 'create a blog with posts', 'add a model', 'build for production')"),
    },
    async ({ task }) => {
      const taskLower = task.toLowerCase();
      const suggestions: string[] = [];

      // Match common tasks to CLI commands
      if (taskLower.includes("create") || taskLower.includes("new project") || taskLower.includes("start")) {
        suggestions.push(
          `## Create a new project\n\n\`\`\`\nduxt create <project-name>\n\`\`\`\n\nOptions:\n- \`--mode=static\` (default) — Static site, no server needed\n- \`--mode=server\` — Full-stack with ORM and API routes\n- \`--template=minimal\` (default) or \`--template=full\`\n- \`--directory=<path>\` — Where to create the project`
        );
      }

      if (taskLower.includes("dev") || taskLower.includes("run") || taskLower.includes("start") || taskLower.includes("serve")) {
        suggestions.push(
          `## Start development server\n\n\`\`\`\nduxt dev\n\`\`\`\n\nStarts a hot-reload dev server (default port 8080). Watches for file changes and rebuilds automatically.`
        );
      }

      if (taskLower.includes("build") || taskLower.includes("production") || taskLower.includes("deploy")) {
        suggestions.push(
          `## Build for production\n\n\`\`\`\nduxt build\n\`\`\`\n\nCreates an optimized production build in \`.output/\`. For static mode, generates HTML files. For server mode, compiles the Dart server binary.`
        );
      }

      if (taskLower.includes("model") || taskLower.includes("orm") || taskLower.includes("database")) {
        suggestions.push(
          `## Generate a model\n\n\`\`\`\nduxt g model <ModelName> <field:type> [field:type...]\n\`\`\`\n\nExample:\n\`\`\`\nduxt g model Post title:string body:text published:bool\n\`\`\`\n\nCreates \`lib/models/post.dart\` with schema, fromMap/toMap, and migration support.`
        );
      }

      if (taskLower.includes("page") || taskLower.includes("route")) {
        suggestions.push(
          `## Generate a page\n\n\`\`\`\nduxt g page <path>\n\`\`\`\n\nExample:\n\`\`\`\nduxt g page blog/[slug]\n\`\`\`\n\nCreates a page component at the specified route path with file-based routing.`
        );
      }

      if (taskLower.includes("scaffold") || taskLower.includes("crud")) {
        suggestions.push(
          `## Scaffold CRUD\n\n\`\`\`\nduxt scaffold <ResourceName> <field:type> [field:type...]\n\`\`\`\n\nExample:\n\`\`\`\nduxt scaffold Post title:string body:text\n\`\`\`\n\nGenerates: model, API routes (GET/POST/PUT/DELETE), list page, detail page, and form component.`
        );
      }

      if (taskLower.includes("component")) {
        suggestions.push(
          `## Generate a component\n\n\`\`\`\nduxt g component <ComponentName>\n\`\`\`\n\nExample:\n\`\`\`\nduxt g component PostCard\n\`\`\`\n\nCreates a reusable component in \`lib/components/\`.`
        );
      }

      if (taskLower.includes("layout")) {
        suggestions.push(
          `## Generate a layout\n\n\`\`\`\nduxt g layout <LayoutName>\n\`\`\`\n\nExample:\n\`\`\`\nduxt g layout Blog\n\`\`\`\n\nCreates a layout component in \`lib/layouts/\`.`
        );
      }

      if (taskLower.includes("delete") || taskLower.includes("remove") || taskLower.includes("destroy")) {
        suggestions.push(
          `## Delete generated files\n\n\`\`\`\nduxt d <type> <name>\n\`\`\`\n\nExamples:\n\`\`\`\nduxt d model Post\nduxt d page blog/[slug]\nduxt d component PostCard\n\`\`\`\n\nRemoves the generated files for the specified type and name.`
        );
      }

      if (suggestions.length === 0) {
        // Fallback: search docs for the task
        const results = searchDocs(task, 3);
        if (results.length > 0) {
          const docHints = results
            .map((r) => `- **${r.title}** (${r.uri})`)
            .join("\n");
          suggestions.push(
            `No exact CLI command match for "${task}", but these docs might help:\n\n${docHints}\n\nCommon commands:\n- \`duxt create <name>\` — New project\n- \`duxt dev\` — Dev server\n- \`duxt build\` — Production build\n- \`duxt g model|page|component|layout <name>\` — Generate files\n- \`duxt scaffold <name> <fields>\` — Full CRUD\n- \`duxt d <type> <name>\` — Delete generated files`
          );
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: suggestions.join("\n\n---\n\n"),
          },
        ],
      };
    }
  );

  // 5. get_project_structure — Show Duxt project structure
  server.tool(
    "get_project_structure",
    "Show the standard Duxt project directory structure with file explanations.",
    {
      template: z
        .enum(["static", "server", "client"])
        .describe("Project template type"),
    },
    async ({ template }) => {
      const structures: Record<string, string> = {
        static: `# Duxt Static Project Structure

\`\`\`
my-app/
├── pubspec.yaml              # Dart dependencies (jaspr, duxt, duxt_html)
├── duxt.yaml                 # Duxt configuration (mode: static)
├── tailwind.config.js        # Tailwind CSS configuration
├── web/
│   ├── index.html            # HTML entry point
│   ├── styles.tw.css         # Tailwind input CSS
│   └── styles.css            # Compiled CSS (generated)
├── lib/
│   ├── main.dart             # App entry point — registers routes
│   ├── app.dart              # Root app component with DuxtApp
│   ├── pages/                # File-based routing
│   │   ├── index.dart        # / (home page)
│   │   ├── about.dart        # /about
│   │   └── blog/
│   │       ├── index.dart    # /blog
│   │       └── [slug].dart   # /blog/:slug (dynamic route)
│   ├── layouts/              # Page layouts
│   │   └── default.dart      # Default layout with nav/footer
│   └── components/           # Reusable components
│       └── header.dart
└── .output/                  # Build output (generated)
    └── public/               # Static HTML files for deployment
\`\`\`

**Key points:**
- Pages in \`lib/pages/\` map directly to routes (file-based routing)
- Dynamic routes use \`[param]\` syntax: \`[slug].dart\` → \`/:slug\`
- Layouts wrap pages with shared UI (nav, footer)
- Build output goes to \`.output/public/\` — deploy anywhere static`,

        server: `# Duxt Server Project Structure

\`\`\`
my-app/
├── pubspec.yaml              # Dart dependencies (jaspr, duxt, duxt_orm, duxt_html)
├── duxt.yaml                 # Duxt configuration (mode: server)
├── tailwind.config.js        # Tailwind CSS configuration
├── web/
│   ├── index.html            # HTML entry point
│   ├── styles.tw.css         # Tailwind input CSS
│   └── styles.css            # Compiled CSS (generated)
├── lib/
│   ├── main.dart             # App entry point — registers routes
│   ├── app.dart              # Root app component with DuxtApp
│   ├── pages/                # File-based routing (same as static)
│   │   ├── index.dart
│   │   └── blog/
│   │       ├── index.dart
│   │       └── [slug].dart
│   ├── layouts/
│   │   └── default.dart
│   ├── components/
│   │   └── header.dart
│   └── models/               # ORM models
│       └── post.dart         # Model with schema, relations
├── server/
│   ├── main.dart             # Server entry point — DuxtServer setup
│   └── api/                  # API route handlers
│       └── posts.dart        # /api/posts CRUD endpoints
├── database/
│   └── database.sqlite       # SQLite database (dev)
└── .output/                  # Build output (generated)
    ├── bundle/               # Compiled server binary
    └── public/               # Static assets
\`\`\`

**Key points:**
- Same page routing as static, plus server-side API routes
- Models in \`lib/models/\` define database schema using duxt_orm
- Server API in \`server/api/\` handles REST endpoints
- \`duxt_orm\` auto-migrates: creates tables and adds missing columns
- SQLite for dev, PostgreSQL/MySQL for production`,

        client: `# Duxt Client (SPA) Project Structure

\`\`\`
my-app/
├── pubspec.yaml              # Dart dependencies (jaspr, duxt, duxt_html, duxt_signals)
├── duxt.yaml                 # Duxt configuration (mode: client)
├── tailwind.config.js        # Tailwind CSS configuration
├── web/
│   ├── index.html            # HTML entry point (SPA shell)
│   ├── styles.tw.css         # Tailwind input CSS
│   └── styles.css            # Compiled CSS (generated)
├── lib/
│   ├── main.dart             # App entry point
│   ├── app.dart              # Root app component with client-side router
│   ├── pages/                # Client-side routes
│   │   ├── index.dart        # / (home)
│   │   └── dashboard/
│   │       ├── index.dart    # /dashboard
│   │       └── [id].dart     # /dashboard/:id
│   ├── layouts/
│   │   └── default.dart
│   ├── components/
│   │   └── header.dart
│   └── state/                # Reactive state with duxt_signals
│       ├── auth_state.dart   # Authentication signals
│       └── app_state.dart    # Global app state
└── .output/                  # Build output (generated)
    └── public/               # SPA bundle for deployment
\`\`\`

**Key points:**
- Single-page app with client-side routing (no server)
- Uses \`duxt_signals\` for reactive state management
- \`SignalState<T>\` auto-tracks signals read during \`buildComponent()\`
- Deploy as static files to any CDN/host
- Connects to external APIs for data`,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: structures[template],
          },
        ],
      };
    }
  );
}

// Helpers

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function splitCamelCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function dartToColumnType(dartType: string): string {
  const map: Record<string, string> = {
    String: "text",
    string: "text",
    text: "text",
    int: "integer",
    integer: "integer",
    Int: "integer",
    double: "real",
    Double: "real",
    float: "real",
    bool: "boolean",
    Bool: "boolean",
    boolean: "boolean",
    DateTime: "timestamp",
    datetime: "timestamp",
    timestamp: "timestamp",
  };
  return map[dartType] || "text";
}

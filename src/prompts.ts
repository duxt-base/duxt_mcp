import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  // 1. create-page — Guide for creating a Duxt page
  server.prompt(
    "create-page",
    "Step-by-step guide for creating a new Duxt page with routing, layout, and components.",
    {
      pageName: z.string().describe("Name of the page component (e.g. 'BlogPage', 'AboutPage')"),
      route: z.string().describe("Route path (e.g. '/blog', '/about', '/blog/[slug]')"),
    },
    async ({ pageName, route }) => {
      const isDynamic = route.includes("[");
      const paramMatch = route.match(/\[(\w+)\]/);
      const paramName = paramMatch ? paramMatch[1] : null;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Create a new Duxt page called "${pageName}" at route "${route}".

## Steps

1. **Create the page file** at \`lib/pages/${routeToFilePath(route)}.dart\`

2. **Page component structure:**
\`\`\`dart
import 'package:jaspr/jaspr.dart';
import 'package:duxt_html/duxt_html.dart';

class ${pageName} extends StatelessComponent {
  ${isDynamic ? `const ${pageName}({required this.${paramName}});\n\n  final String ${paramName};\n` : ""}
  @override
  Iterable<Component> build(BuildContext context) sync* {
    yield Section(
      className: 'container mx-auto py-8 px-4',
      children: [
        H1(
          className: 'text-3xl font-bold mb-6',
          child: Text('${pageName.replace(/Page$/, "")}'),
        ),
        // Add your content here
      ],
    );
  }
}
\`\`\`

3. **File-based routing:** The file path determines the route:
   - \`lib/pages/index.dart\` → \`/\`
   - \`lib/pages/about.dart\` → \`/about\`
   - \`lib/pages/blog/[slug].dart\` → \`/blog/:slug\`

4. **Apply a layout** by wrapping with your layout component in \`app.dart\`.

${isDynamic ? `5. **Dynamic parameter:** Access \`${paramName}\` from the route params in your page component.` : ""}

## Key patterns
- Use \`duxt_html\` components (Section, H1, P, Div, etc.) for semantic HTML
- Use Tailwind CSS classes via \`className\` parameter
- For data fetching in server mode, use \`DuxtServer\` API routes
- For reactive state, use \`duxt_signals\` (SignalState, computed, effects)`,
            },
          },
        ],
      };
    }
  );

  // 2. create-model — Guide for creating an ORM model
  server.prompt(
    "create-model",
    "Step-by-step guide for creating a Duxt ORM model with schema, relations, and migrations.",
    {
      modelName: z.string().describe("Model class name (e.g. 'Post', 'User', 'Comment')"),
      fields: z.string().describe("Comma-separated fields with types (e.g. 'title:String, body:String, published:bool')"),
    },
    async ({ modelName, fields }) => {
      const fieldPairs = fields.split(",").map((f) => {
        const [name, type] = f.trim().split(":");
        return { name: name.trim(), type: type?.trim() || "String" };
      });

      const tableName = toSnakeCase(modelName) + "s";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Create a Duxt ORM model called "${modelName}" with fields: ${fields}.

## Steps

1. **Create the model file** at \`lib/models/${toSnakeCase(modelName)}.dart\`

2. **Model code:**
\`\`\`dart
import 'package:duxt_orm/duxt_orm.dart';

class ${modelName} extends Model {
  @override
  String get tableName => '${tableName}';

  @override
  Map<String, ColumnType> get schema => {
${fieldPairs.map((f) => `    '${f.name}': ColumnType.${dartToColumnType(f.type)},`).join("\n")}
  };

${fieldPairs.map((f) => `  ${f.type}? ${f.name};`).join("\n")}

  @override
  void fromMap(Map<String, dynamic> map) {
    super.fromMap(map);
${fieldPairs.map((f) => `    ${f.name} = map['${f.name}'] as ${f.type}?;`).join("\n")}
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
${fieldPairs.map((f) => `      '${f.name}': ${f.name},`).join("\n")}
    };
  }
}
\`\`\`

3. **Register the model** in your server setup:
\`\`\`dart
await ${modelName}().migrate();
\`\`\`

4. **Auto-migration:** \`migrate()\` will:
   - Create the table if it doesn't exist
   - Add any missing columns via ALTER TABLE
   - Never modify or drop existing columns

## Common operations
\`\`\`dart
// Create
final post = ${modelName}()..${fieldPairs[0]?.name} = 'value';
await post.save();

// Query
final all = await ${modelName}().all();
final found = await ${modelName}().find(1);
final filtered = await ${modelName}().where('${fieldPairs[0]?.name}', '=', 'value').get();

// Update
found.${fieldPairs[0]?.name} = 'new value';
await found.save();

// Delete
await found.delete();
\`\`\`

## Adding relations
\`\`\`dart
// HasMany
List<HasMany> get hasMany => [HasMany<Comment>()];

// BelongsTo
List<BelongsTo> get belongsTo => [BelongsTo<User>()];
\`\`\``,
            },
          },
        ],
      };
    }
  );

  // 3. scaffold-crud — Guide for full CRUD scaffolding
  server.prompt(
    "scaffold-crud",
    "Complete guide for scaffolding a full CRUD resource with model, API, pages, and components.",
    {
      resourceName: z.string().describe("Resource name (e.g. 'Post', 'Product', 'User')"),
      fields: z.string().describe("Comma-separated fields with types (e.g. 'title:String, price:double, active:bool')"),
    },
    async ({ resourceName, fields }) => {
      const fieldPairs = fields.split(",").map((f) => {
        const [name, type] = f.trim().split(":");
        return { name: name.trim(), type: type?.trim() || "String" };
      });
      const snake = toSnakeCase(resourceName);
      const plural = snake + "s";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Scaffold full CRUD for "${resourceName}" with fields: ${fields}.

## What to generate

### 1. Model — \`lib/models/${snake}.dart\`
ORM model with schema, fromMap/toMap (see create-model prompt).

### 2. API Routes — \`server/api/${plural}.dart\`
\`\`\`dart
import 'package:duxt/duxt.dart';
import '../models/${snake}.dart';

void register${resourceName}Api(DuxtServer server) {
  // List all
  server.get('/api/${plural}', (req) async {
    final items = await ${resourceName}().all();
    return Response.json(items.map((i) => i.toMap()).toList());
  });

  // Get one
  server.get('/api/${plural}/:id', (req) async {
    final item = await ${resourceName}().find(int.parse(req.params['id']!));
    return Response.json(item.toMap());
  });

  // Create
  server.post('/api/${plural}', (req) async {
    final body = await req.body();
    final item = ${resourceName}()
${fieldPairs.map((f) => `      ..${f.name} = body['${f.name}']`).join("\n")};
    await item.save();
    return Response.json(item.toMap(), statusCode: 201);
  });

  // Update
  server.put('/api/${plural}/:id', (req) async {
    final body = await req.body();
    final item = await ${resourceName}().find(int.parse(req.params['id']!));
${fieldPairs.map((f) => `    item.${f.name} = body['${f.name}'] ?? item.${f.name};`).join("\n")}
    await item.save();
    return Response.json(item.toMap());
  });

  // Delete
  server.delete('/api/${plural}/:id', (req) async {
    final item = await ${resourceName}().find(int.parse(req.params['id']!));
    await item.delete();
    return Response.json({'deleted': true});
  });
}
\`\`\`

### 3. List Page — \`lib/pages/${plural}/index.dart\`
Page showing all ${plural} with links to detail view.

### 4. Detail Page — \`lib/pages/${plural}/[id].dart\`
Page showing a single ${resourceName} by ID.

### 5. Form Component — \`lib/components/${snake}_form.dart\`
Reusable form for create/edit with fields:
${fieldPairs.map((f) => `- \`${f.name}\` (${f.type})`).join("\n")}

## CLI shortcut
\`\`\`
duxt scaffold ${resourceName} ${fieldPairs.map((f) => `${f.name}:${f.type.toLowerCase()}`).join(" ")}
\`\`\`

This generates all 5 files automatically.

## After scaffolding
1. Run \`duxt dev\` to start the server
2. The model auto-migrates on first run
3. Visit \`/${plural}\` to see the list page
4. API available at \`/api/${plural}\``,
            },
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

function routeToFilePath(route: string): string {
  return route.replace(/^\//, "").replace(/\/$/, "") || "index";
}

function dartToColumnType(dartType: string): string {
  const map: Record<string, string> = {
    String: "text",
    string: "text",
    int: "integer",
    double: "real",
    bool: "boolean",
    DateTime: "timestamp",
  };
  return map[dartType] || "text";
}

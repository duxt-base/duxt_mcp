import matter from "gray-matter";

export interface DocPage {
  uri: string;
  section: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  content: string;
  rawContent: string;
}

const REPO = "duxt-base/duxt-docs";
const BRANCH = "main";
const SECTIONS = [
  "duxt",
  "duxt-cli",
  "duxt-html",
  "duxt-orm",
  "duxt-signals",
  "duxt-icons",
  "duxt-ui",
  "tutorials",
];

const docs: Map<string, DocPage> = new Map();

export async function loadDocs(): Promise<void> {
  docs.clear();

  try {
    // Fetch entire repo tree in one API call
    const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const treeRes = await fetch(treeUrl, {
      headers: { "User-Agent": "duxt-mcp" },
    });

    if (!treeRes.ok) {
      console.error(`Failed to fetch repo tree: ${treeRes.status} ${treeRes.statusText}`);
      return;
    }

    const tree = (await treeRes.json()) as {
      tree: Array<{ path: string; type: string }>;
    };

    // Filter for markdown files in lib/{section}/content/*.md
    const mdFiles = tree.tree.filter(
      (entry) =>
        entry.type === "blob" &&
        entry.path.endsWith(".md") &&
        entry.path.startsWith("lib/") &&
        entry.path.includes("/content/")
    );

    // Fetch all files in parallel
    const fetches = mdFiles.map(async (entry) => {
      // entry.path = "lib/duxt/content/routing.md"
      const parts = entry.path.split("/");
      // parts = ["lib", "duxt", "content", "routing.md"]
      if (parts.length < 4) return;

      const section = parts[1];
      if (!SECTIONS.includes(section)) return;

      const slug = parts[parts.length - 1].replace(/\.md$/, "");
      const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${entry.path}`;

      try {
        const res = await fetch(rawUrl, {
          headers: { "User-Agent": "duxt-mcp" },
        });
        if (!res.ok) return;

        const raw = await res.text();
        const { data, content } = matter(raw);

        const uri = `duxt://docs/${section}/${slug}`;

        docs.set(uri, {
          uri,
          section,
          slug,
          title: (data.title as string) || slug,
          description: (data.description as string) || "",
          order: (data.order as number) || 0,
          content,
          rawContent: raw,
        });
      } catch {
        // Skip individual file failures
      }
    });

    await Promise.all(fetches);

    const sections = new Set(Array.from(docs.values()).map((d) => d.section));
    console.log(
      `Loaded ${docs.size} docs from ${sections.size} sections (GitHub: ${REPO})`
    );
  } catch (err) {
    console.error("Failed to load docs from GitHub:", err);
  }
}

export function getAllDocs(): DocPage[] {
  return Array.from(docs.values()).sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.order - b.order;
  });
}

export function getDoc(uri: string): DocPage | undefined {
  return docs.get(uri);
}

export function getDocsBySection(section: string): DocPage[] {
  return getAllDocs().filter((d) => d.section === section);
}

export function searchDocs(
  query: string,
  maxResults: number = 10
): Array<DocPage & { score: number }> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: Array<DocPage & { score: number }> = [];

  for (const doc of docs.values()) {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const descLower = doc.description.toLowerCase();

    for (const term of terms) {
      // Title match (highest weight)
      if (titleLower.includes(term)) score += 10;

      // Description match
      if (descLower.includes(term)) score += 5;

      // Content matches (count occurrences)
      const contentMatches = contentLower.split(term).length - 1;
      score += Math.min(contentMatches, 10);

      // URI match
      if (doc.uri.toLowerCase().includes(term)) score += 3;
    }

    if (score > 0) {
      results.push({ ...doc, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

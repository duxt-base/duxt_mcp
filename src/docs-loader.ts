import fs from "node:fs";
import path from "node:path";
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

const DOCS_DIR = path.join(import.meta.dirname, "..", "docs");

const docs: Map<string, DocPage> = new Map();

export function loadDocs(): void {
  docs.clear();

  if (!fs.existsSync(DOCS_DIR)) {
    console.warn(`Docs directory not found: ${DOCS_DIR}`);
    return;
  }

  const sections = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const section of sections) {
    const sectionDir = path.join(DOCS_DIR, section);
    const files = fs
      .readdirSync(sectionDir)
      .filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(sectionDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      const slug = file.replace(/\.md$/, "");
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
    }
  }

  console.log(`Loaded ${docs.size} docs from ${sections.length} sections`);
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

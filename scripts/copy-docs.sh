#!/bin/bash
# Copy markdown docs from duxt_docs into docs/ directory
# Structure: docs/{section}/{file}.md

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCS_SRC="${PROJECT_DIR}/../duxt_docs/lib"
DOCS_DEST="${PROJECT_DIR}/docs"

# Sections to copy
SECTIONS=(
  "duxt"
  "duxt-cli"
  "duxt-html"
  "duxt-orm"
  "duxt-signals"
  "duxt-icons"
  "tutorials"
)

echo "Copying docs from duxt_docs..."

for section in "${SECTIONS[@]}"; do
  src="${DOCS_SRC}/${section}/content"
  dest="${DOCS_DEST}/${section}"

  if [ -d "$src" ]; then
    mkdir -p "$dest"
    cp "$src"/*.md "$dest/" 2>/dev/null || true
    count=$(ls -1 "$dest"/*.md 2>/dev/null | wc -l | tr -d ' ')
    echo "  ${section}: ${count} files"
  else
    echo "  ${section}: skipped (not found)"
  fi
done

total=$(find "$DOCS_DEST" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "Total: ${total} docs copied"

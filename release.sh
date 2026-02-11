#!/bin/bash
# Release duxt-mcp: commit, push, deploy

set -e

VERSION=$(node -p "require('./package.json').version")

echo ""
echo "Releasing duxt-mcp v${VERSION}"
echo ""

# Copy docs
echo "-> Copying docs..."
bash scripts/copy-docs.sh

# Git
echo "-> Committing..."
git add -A
git commit -m "release: v${VERSION}" || echo "Nothing to commit"
git push origin main

# Deploy
echo "-> Deploying..."
bp deploy --force

echo ""
echo "Released v${VERSION} to https://mcp.duxt.dev"
echo ""

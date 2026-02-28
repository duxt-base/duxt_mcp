#!/bin/bash
# Release duxt-mcp: commit, push, deploy

set -e

VERSION=$(node -p "require('./package.json').version")

echo ""
echo "Releasing duxt-mcp v${VERSION}"
echo ""

# Git
echo "-> Pushing..."
git push origin main

# Deploy
echo "-> Deploying..."
bp deploy --force

echo ""
echo "Released v${VERSION} to https://mcp.duxt.dev"
echo ""

#!/bin/bash
# Deploy duxt-mcp to Basepod

set -e

echo ""
echo "Deploying duxt-mcp server"
echo ""

# Copy docs from duxt_docs
echo "-> Copying docs..."
bash scripts/copy-docs.sh

# Deploy
echo "-> Deploying to Basepod..."
bp deploy --force

echo ""
echo "Deployed to https://mcp.duxt.dev"
echo ""

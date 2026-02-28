#!/bin/bash
# Deploy duxt-mcp to Basepod

set -e

echo ""
echo "Deploying duxt-mcp server"
echo ""

# Deploy (docs are fetched from GitHub at startup)
echo "-> Deploying to Basepod..."
bp deploy --force

echo ""
echo "Deployed to https://mcp.duxt.dev"
echo ""

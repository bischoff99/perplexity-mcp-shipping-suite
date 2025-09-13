#!/bin/bash

# =============================================================================
# Perplexity MCP Shipping Suite - Quick Start Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Perplexity MCP Shipping Suite - Quick Start${NC}"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}📝 Please edit .env file with your API keys:${NC}"
        echo "   - EASYPOST_API_KEY"
        echo "   - VEEQO_API_KEY"
        echo ""
        echo "Press Enter to continue after editing .env file..."
        read
    else
        echo -e "${RED}❌ env.example file not found!${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
echo ""
echo -e "${GREEN}Services will be available at:${NC}"
echo "   Web Interface: http://localhost:3003"
echo "   EasyPost MCP:  http://localhost:3000/health"
echo "   Veeqo MCP:     http://localhost:3002/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start development servers
npm run dev

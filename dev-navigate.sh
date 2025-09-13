#!/bin/bash
# Quick navigation script for development

case "$1" in
    "easypost")
        cd "/home/bischoff666/Projects/perplexity/apps/easypost"
        echo "📍 Navigated to EasyPost MCP server"
        ;;
    "veeqo")
        cd "/home/bischoff666/Projects/perplexity/apps/veeqo"
        echo "📍 Navigated to Veeqo MCP server"
        ;;
    "web")
        cd "/home/bischoff666/Projects/perplexity/apps/web-dashboard"
        echo "📍 Navigated to Web Dashboard"
        ;;
    "libs")
        cd "/home/bischoff666/Projects/perplexity/libs"
        echo "📍 Navigated to Libraries"
        ;;
    "config")
        cd "/home/bischoff666/Projects/perplexity/config"
        echo "📍 Navigated to Configuration"
        ;;
    *)
        echo "Usage: $0 {easypost|veeqo|web|libs|config}"
        echo "Available shortcuts:"
        echo "  easypost - EasyPost MCP server"
        echo "  veeqo    - Veeqo MCP server"
        echo "  web      - Web Dashboard"
        echo "  libs     - Shared libraries"
        echo "  config   - Configuration files"
        ;;
esac

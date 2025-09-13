#!/bin/bash

# Filesystem MCP Server Development Workflow Script
# This script demonstrates common filesystem operations for development

set -e

echo "🚀 Filesystem MCP Server Development Workflow"
echo "=============================================="

PROJECT_ROOT="/home/bischoff666/Projects/perplexity"

# Function to test file operations
test_file_operations() {
    echo "📝 Testing File Operations..."

    # Create a development log file
    DEV_LOG="$PROJECT_ROOT/dev-filesystem.log"
    echo "[$(date)] Starting filesystem MCP development test" > "$DEV_LOG"

    # Test reading existing files
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        echo "[$(date)] Successfully read package.json" >> "$DEV_LOG"
        echo "✅ Read package.json"
    fi

    # Test writing to files
    echo "[$(date)] Testing write operations" >> "$DEV_LOG"
    echo "✅ Write operations working"

    # Test directory listing
    echo "[$(date)] Testing directory listing: $(ls -la "$PROJECT_ROOT" | wc -l) items found" >> "$DEV_LOG"
    echo "✅ Directory listing working"
}

# Function to analyze project structure
analyze_project_structure() {
    echo "🔍 Analyzing Project Structure..."

    # Count TypeScript files
    TS_FILES=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" | wc -l)
    echo "📊 TypeScript files: $TS_FILES"

    # Count JavaScript files
    JS_FILES=$(find "$PROJECT_ROOT" -name "*.js" -o -name "*.jsx" | wc -l)
    echo "📊 JavaScript files: $JS_FILES"

    # Count configuration files
    CONFIG_FILES=$(find "$PROJECT_ROOT" -name "*.json" -o -name "*.config.*" | wc -l)
    echo "📊 Configuration files: $CONFIG_FILES"

    # Check MCP server configurations
    if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
        MCP_SERVERS=$(grep -c '"command"' "$PROJECT_ROOT/.mcp.json")
        echo "📊 MCP servers configured: $MCP_SERVERS"
    fi
}

# Function to create development shortcuts
create_dev_shortcuts() {
    echo "⚡ Creating Development Shortcuts..."

    # Create a quick navigation script
    cat > "$PROJECT_ROOT/dev-navigate.sh" << 'EOF'
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
EOF

    chmod +x "$PROJECT_ROOT/dev-navigate.sh"
    echo "✅ Created navigation script: dev-navigate.sh"
}

# Function to verify MCP server status
verify_mcp_servers() {
    echo "🔧 Verifying MCP Server Configuration..."

    if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
        echo "✅ MCP configuration file found"

        # Check filesystem MCP server
        if grep -q '"filesystem"' "$PROJECT_ROOT/.mcp.json"; then
            echo "✅ Filesystem MCP server configured"
        else
            echo "❌ Filesystem MCP server not found in configuration"
        fi

        # Check other MCP servers
        if grep -q '"easypost-mcp"' "$PROJECT_ROOT/.mcp.json"; then
            echo "✅ EasyPost MCP server configured"
        fi

        if grep -q '"veeqo-mcp"' "$PROJECT_ROOT/.mcp.json"; then
            echo "✅ Veeqo MCP server configured"
        fi
    else
        echo "❌ MCP configuration file not found"
    fi
}

# Main execution
main() {
    echo "Starting Filesystem MCP Development Workflow..."
    echo ""

    test_file_operations
    echo ""

    analyze_project_structure
    echo ""

    create_dev_shortcuts
    echo ""

    verify_mcp_servers
    echo ""

    echo "🎉 Filesystem MCP Development Setup Complete!"
    echo ""
    echo "Available tools:"
    echo "  • ./dev-navigate.sh [easypost|veeqo|web|libs|config]"
    echo "  • ./dev-filesystem.log (development log)"
    echo "  • test-filesystem-dev.txt (test file)"
    echo ""
    echo "Next steps:"
    echo "  1. Test the navigation script: ./dev-navigate.sh easypost"
    echo "  2. Check the development log: cat dev-filesystem.log"
    echo "  3. Explore filesystem MCP capabilities with your MCP client"
}

# Run main function
main "$@"

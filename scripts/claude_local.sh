#!/bin/bash

# Claude Local CLI Integration Script
# This script provides local Claude CLI integration for MCP Shipping Suite
# Requires Claude CLI to be installed and authenticated locally

set -e

# Configuration
CLAUDE_OUTPUT_FILE="SUMMARY_CLAUDE.md"
ARTIFACTS_DIR="ARTIFACTS"
PROJECT_SUMMARY_FILE="SUMMARY.md"
CLAUDE_PROMPT_FILE="$ARTIFACTS_DIR/CLAUDE_PROMPT_FOR_SUMMARY.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Claude CLI is installed
check_claude_cli() {
    if ! command -v claude &> /dev/null; then
        error "Claude CLI is not installed."
        echo ""
        echo "To install Claude CLI:"
        echo "1. Visit https://claude.ai/cli for installation instructions"
        echo "2. Install via npm: npm install -g @anthropic-ai/claude-cli"
        echo "3. Authenticate: claude auth login"
        echo ""
        exit 1
    fi
}

# Check if Claude CLI is authenticated
check_claude_auth() {
    if ! claude auth status &> /dev/null; then
        error "Claude CLI is not authenticated."
        echo ""
        echo "To authenticate Claude CLI:"
        echo "1. Run: claude auth login"
        echo "2. Follow the authentication prompts"
        echo "3. Verify with: claude auth status"
        echo ""
        exit 1
    fi
}

# Generate project summary if it doesn't exist
ensure_project_summary() {
    if [ ! -f "$PROJECT_SUMMARY_FILE" ]; then
        info "Project summary not found. Generating..."
        node scripts/generate-summary.js
        success "Project summary generated: $PROJECT_SUMMARY_FILE"
    else
        info "Using existing project summary: $PROJECT_SUMMARY_FILE"
    fi
}

# Generate Claude prompt if it doesn't exist  
ensure_claude_prompt() {
    if [ ! -f "$CLAUDE_PROMPT_FILE" ]; then
        info "Claude prompt not found. Generating..."
        mkdir -p "$ARTIFACTS_DIR"
        node scripts/generate-summary.js
        success "Claude prompt generated: $CLAUDE_PROMPT_FILE"
    else
        info "Using existing Claude prompt: $CLAUDE_PROMPT_FILE"
    fi
}

# Main Claude interaction function
run_claude_analysis() {
    info "Starting Claude analysis of MCP Shipping Suite..."
    
    # Create a combined input for Claude
    local combined_input="$(cat "$CLAUDE_PROMPT_FILE")"
    
    # Add project summary content
    if [ -f "$PROJECT_SUMMARY_FILE" ]; then
        combined_input="${combined_input}

## Current Project Summary
$(cat "$PROJECT_SUMMARY_FILE")"
    fi

    # Add recent git changes context
    if git rev-parse --git-dir > /dev/null 2>&1; then
        combined_input="${combined_input}

## Recent Changes
$(git log --oneline -10 2>/dev/null || echo "No git history available")"
    fi

    info "Sending analysis request to Claude..."
    
    # Send to Claude CLI and save output
    echo "$combined_input" | claude chat --model=claude-3-5-sonnet-20241022 > "$CLAUDE_OUTPUT_FILE"
    
    if [ $? -eq 0 ] && [ -s "$CLAUDE_OUTPUT_FILE" ]; then
        success "Claude analysis completed: $CLAUDE_OUTPUT_FILE"
        echo ""
        info "Summary of Claude's analysis:"
        head -n 10 "$CLAUDE_OUTPUT_FILE" | sed 's/^/  /'
        echo "  ..."
        echo ""
        info "Full analysis saved to: $CLAUDE_OUTPUT_FILE"
    else
        error "Claude analysis failed or produced no output"
        exit 1
    fi
}

# Interactive mode function
interactive_mode() {
    info "Starting interactive Claude session..."
    echo ""
    echo "Available commands:"
    echo "  /analyze     - Run full project analysis"
    echo "  /summary     - Generate and send project summary"
    echo "  /code <file> - Analyze specific code file"
    echo "  /help        - Show available commands"
    echo "  /exit        - Exit interactive mode"
    echo ""
    
    while true; do
        echo -n "Claude MCP> "
        read -r command args
        
        case "$command" in
            "/analyze")
                run_claude_analysis
                ;;
            "/summary")
                ensure_project_summary
                claude chat --model=claude-3-5-sonnet-20241022 < "$PROJECT_SUMMARY_FILE"
                ;;
            "/code")
                if [ -n "$args" ] && [ -f "$args" ]; then
                    echo "Please analyze this code file from the MCP Shipping Suite:" | claude chat --model=claude-3-5-sonnet-20241022 --include-file "$args"
                else
                    error "File not found: $args"
                fi
                ;;
            "/help")
                echo "Available commands:"
                echo "  /analyze     - Run full project analysis"
                echo "  /summary     - Generate and send project summary"  
                echo "  /code <file> - Analyze specific code file"
                echo "  /help        - Show available commands"
                echo "  /exit        - Exit interactive mode"
                ;;
            "/exit")
                info "Exiting interactive mode"
                break
                ;;
            "")
                # Empty input, continue
                ;;
            *)
                # Regular chat message
                echo "$command $args" | claude chat --model=claude-3-5-sonnet-20241022
                ;;
        esac
    done
}

# Usage function
usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Claude Local CLI Integration for MCP Shipping Suite"
    echo ""
    echo "OPTIONS:"
    echo "  -a, --analyze     Run full project analysis"
    echo "  -i, --interactive Start interactive Claude session"
    echo "  -s, --summary     Generate project summary only"
    echo "  -c, --check       Check Claude CLI installation and auth"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --analyze      # Run complete project analysis"
    echo "  $0 --interactive  # Start interactive session"
    echo "  $0 --check        # Verify Claude CLI setup"
    echo ""
    echo "REQUIREMENTS:"
    echo "  - Claude CLI installed and authenticated"
    echo "  - Active internet connection"
    echo "  - Claude Pro or API access"
    echo ""
}

# Main script logic
main() {
    case "${1:-}" in
        -a|--analyze)
            check_claude_cli
            check_claude_auth
            ensure_project_summary
            ensure_claude_prompt
            run_claude_analysis
            ;;
        -i|--interactive)
            check_claude_cli
            check_claude_auth
            ensure_project_summary
            ensure_claude_prompt
            interactive_mode
            ;;
        -s|--summary)
            ensure_project_summary
            success "Project summary available: $PROJECT_SUMMARY_FILE"
            ;;
        -c|--check)
            info "Checking Claude CLI installation..."
            check_claude_cli
            success "Claude CLI is installed"
            
            info "Checking Claude CLI authentication..."
            check_claude_auth
            success "Claude CLI is authenticated"
            
            info "Claude CLI is ready for use!"
            ;;
        -h|--help)
            usage
            ;;
        "")
            # No arguments provided, run default analysis
            warning "No arguments provided. Running default analysis..."
            check_claude_cli
            check_claude_auth
            ensure_project_summary
            ensure_claude_prompt
            run_claude_analysis
            ;;
        *)
            error "Unknown option: $1"
            echo ""
            usage
            exit 1
            ;;
    esac
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
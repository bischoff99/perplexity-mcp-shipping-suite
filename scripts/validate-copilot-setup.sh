#!/bin/bash

# GitHub Copilot Configuration Validation Script
# Validates that all Copilot setup files are properly configured

echo "🤖 GitHub Copilot Configuration Validation"
echo "=========================================="

# Check for required files
echo ""
echo "📂 Checking required configuration files..."

files=(
    ".github/copilot-instructions.md"
    ".copilotignore" 
    ".vscode/settings.json"
    ".vscode/launch.json"
    ".vscode/extensions.json"
    ".vscode/snippets.code-snippets"
    ".vscode/perplexity-mcp.code-workspace"
    "docs/github-copilot-guide.md"
)

all_files_exist=true

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        all_files_exist=false
    fi
done

echo ""

# Check file contents
echo "📝 Validating file contents..."

# Check copilot-instructions.md
if [[ -f ".github/copilot-instructions.md" ]]; then
    if grep -q "Model Context Protocol" ".github/copilot-instructions.md"; then
        echo "✅ copilot-instructions.md contains MCP context"
    else
        echo "⚠️  copilot-instructions.md missing MCP context"
    fi
else
    echo "❌ copilot-instructions.md not found"
fi

# Check .copilotignore
if [[ -f ".copilotignore" ]]; then
    if grep -q ".env" ".copilotignore"; then
        echo "✅ .copilotignore excludes environment files"
    else
        echo "⚠️  .copilotignore missing environment file exclusions"
    fi
else
    echo "❌ .copilotignore not found"
fi

# Check VS Code settings
if [[ -f ".vscode/settings.json" ]]; then
    if grep -q "github.copilot" ".vscode/settings.json"; then
        echo "✅ VS Code settings include Copilot configuration"
    else
        echo "⚠️  VS Code settings missing Copilot configuration"
    fi
else
    echo "❌ VS Code settings.json not found"
fi

# Check extensions
if [[ -f ".vscode/extensions.json" ]]; then
    if grep -q "github.copilot" ".vscode/extensions.json"; then
        echo "✅ Extensions include GitHub Copilot"
    else
        echo "⚠️  Extensions missing GitHub Copilot"
    fi
else
    echo "❌ VS Code extensions.json not found"
fi

echo ""

# Check gitignore configuration
echo "🔒 Checking .gitignore configuration..."

if [[ -f ".gitignore" ]]; then
    if grep -A5 ".vscode/" ".gitignore" | grep -q "!.vscode/settings.json"; then
        echo "✅ .gitignore allows VS Code configuration files"
    else
        echo "⚠️  .gitignore may not allow VS Code configuration files"
    fi
else
    echo "❌ .gitignore not found"
fi

echo ""

# Check if files are tracked by git
echo "📊 Checking Git tracking status..."

tracked_files=$(git ls-files | grep -E "(copilot|\.vscode)" | wc -l)
echo "✅ $tracked_files Copilot/VS Code files tracked by Git"

echo ""

# Summary
echo "📋 Validation Summary"
echo "===================="

if $all_files_exist; then
    echo "✅ All required configuration files present"
    echo "🎉 GitHub Copilot setup appears to be complete!"
    echo ""
    echo "Next steps:"
    echo "1. Open VS Code: code .vscode/perplexity-mcp.code-workspace"
    echo "2. Install extensions: GitHub Copilot and GitHub Copilot Chat"
    echo "3. Test with sample code in docs/copilot-validation-test.md"
else
    echo "❌ Some configuration files are missing"
    echo "Please ensure all required files are created and committed"
fi

echo ""
echo "For detailed usage instructions, see: docs/github-copilot-guide.md"
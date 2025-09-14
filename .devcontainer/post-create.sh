#!/bin/bash

# Post-create script for devcontainer setup
set -e

echo "🚀 Starting post-create setup for MCP Shipping Suite..."

# Install zsh and oh-my-zsh for better terminal experience
sudo apt-get update
sudo apt-get install -y zsh curl git

# Install oh-my-zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    export PNPM_HOME="/home/node/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# Install pipx for Python global packages
if ! command -v pipx &> /dev/null; then
    echo "🐍 Installing pipx..."
    python -m pip install --user pipx
    python -m pipx ensurepath
fi

# Install common Python development tools
echo "🛠️  Installing Python development tools..."
pipx install black
pipx install ruff
pipx install mypy
pipx install pytest
pipx install huggingface-cli

# Install dependencies
echo "📚 Installing project dependencies..."
pnpm install

# Build shared libraries first
echo "🔨 Building shared libraries..."
pnpm run build:libs

# Setup git hooks
echo "🪝 Setting up git hooks..."
pnpm run prepare

# Create necessary directories
mkdir -p scripts
mkdir -p ARTIFACTS

# Set up default git configuration
git config --global core.editor "code --wait"
git config --global init.defaultBranch main

# Install GitHub CLI if not present
if ! command -v gh &> /dev/null; then
    echo "🐙 Installing GitHub CLI..."
    type -p curl >/dev/null || sudo apt install curl -y
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && sudo apt update \
    && sudo apt install gh -y
fi

# Set zsh as default shell
if [ "$SHELL" != "/bin/zsh" ]; then
    echo "🐚 Setting zsh as default shell..."
    chsh -s /bin/zsh
fi

echo "✅ Post-create setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Run 'pnpm run dev' to start all services"
echo "2. Open http://localhost:3003 for the web dashboard"
echo "3. Check health endpoints:"
echo "   - EasyPost MCP: http://localhost:3000/health"
echo "   - Veeqo MCP: http://localhost:3002/health"
echo ""
echo "🤖 AI tooling available:"
echo "- GitHub Copilot: Enabled in VS Code"
echo "- Claude CLI: Use 'scripts/claude_local.sh' (requires authentication)"
echo "- Hugging Face CLI: Use 'huggingface-cli login' to authenticate"
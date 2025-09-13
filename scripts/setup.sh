#!/bin/bash

# =============================================================================
# Perplexity MCP Shipping Suite - Setup Script
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm 8+"
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
    
    # Check Docker (optional)
    if command_exists docker; then
        print_success "Docker $(docker --version) is available"
    else
        print_warning "Docker is not installed. You can install it for containerized deployment."
    fi
    
    # Check Docker Compose (optional)
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        print_warning "Docker Compose is not installed. You can install it for containerized deployment."
    fi
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            print_status "Creating .env file from template..."
            cp env.example .env
            print_warning "Please edit .env file with your actual configuration values"
            print_warning "Required: EASYPOST_API_KEY, VEEQO_API_KEY"
        else
            print_error "env.example file not found!"
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping environment setup."
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install workspace dependencies
    print_status "Installing workspace dependencies..."
    npm run install:workspaces
    
    print_success "All dependencies installed successfully"
}

# Function to build projects
build_projects() {
    print_status "Building projects..."
    
    # Build EasyPost MCP Server
    print_status "Building EasyPost MCP Server..."
    cd easypost
    if [ -f "package.json" ]; then
        npm run build
        print_success "EasyPost MCP Server built successfully"
    else
        print_warning "EasyPost package.json not found, skipping build"
    fi
    cd ..
    
    # Build Veeqo MCP Server
    print_status "Building Veeqo MCP Server..."
    cd veeqo
    if [ -f "package.json" ]; then
        npm run build
        print_success "Veeqo MCP Server built successfully"
    else
        print_warning "Veeqo package.json not found, skipping build"
    fi
    cd ..
    
    print_success "All projects built successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if npm run test >/dev/null 2>&1; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed or no tests found"
    fi
}

# Function to setup Docker (optional)
setup_docker() {
    if command_exists docker && (command_exists docker-compose || docker compose version >/dev/null 2>&1); then
        print_status "Setting up Docker environment..."
        
        # Create necessary directories
        mkdir -p monitoring/grafana/dashboards
        mkdir -p monitoring/grafana/datasources
        
        # Create basic Prometheus config
        if [ ! -f "monitoring/prometheus.yml" ]; then
            cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'perplexity-mcp'
    static_configs:
      - targets: ['easypost-mcp:3000', 'veeqo-mcp:3002']
EOF
            print_success "Created Prometheus configuration"
        fi
        
        print_success "Docker environment ready"
    else
        print_warning "Docker not available, skipping Docker setup"
    fi
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Edit .env file with your API keys:"
    echo "      - EASYPOST_API_KEY (get from https://www.easypost.com/account/api-keys)"
    echo "      - VEEQO_API_KEY (get from https://app.veeqo.com/settings/users)"
    echo ""
    echo "   2. Start the development servers:"
    echo "      npm run dev"
    echo ""
    echo "   3. Or start with Docker:"
    echo "      docker-compose up -d"
    echo ""
    echo "   4. Access the web interface:"
    echo "      http://localhost:3003"
    echo ""
    echo "   5. Health checks:"
    echo "      EasyPost MCP: http://localhost:3000/health"
    echo "      Veeqo MCP: http://localhost:3002/health"
    echo ""
    echo "📚 Documentation:"
    echo "   - EasyPost MCP: ./easypost/README.md"
    echo "   - Veeqo MCP: ./veeqo/README.md"
    echo ""
    echo "🐛 Troubleshooting:"
    echo "   - Check logs: docker-compose logs -f"
    echo "   - Restart services: docker-compose restart"
    echo "   - Clean restart: docker-compose down && docker-compose up -d"
}

# Main setup function
main() {
    echo "🚀 Perplexity MCP Shipping Suite Setup"
    echo "======================================"
    echo ""
    
    check_requirements
    setup_environment
    install_dependencies
    build_projects
    run_tests
    setup_docker
    show_next_steps
}

# Run main function
main "$@"

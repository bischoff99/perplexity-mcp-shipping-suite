# 🚀 Perplexity MCP Shipping Suite

A comprehensive **Model Context Protocol (MCP) Shipping Automation Suite** that integrates EasyPost, Veeqo, and provides a modern web interface for complete shipping workflow management.

## 📋 Overview

This project consists of three main components:

- **🌐 Web Interface** - Modern, responsive dashboard for shipping operations
- **📦 EasyPost MCP Server** - Production-ready MCP server for EasyPost API integration
- **📊 Veeqo MCP Server** - Advanced MCP server for Veeqo inventory and order management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Interface │    │ EasyPost MCP    │    │  Veeqo MCP      │
│   (Port 3003)   │◄──►│   (Port 3000)   │    │  (Port 3002)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  EasyPost API   │    │   Veeqo API     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Redis Cache    │
│  PostgreSQL     │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Docker** (optional, for containerized deployment)
- **EasyPost API Key** ([Get one here](https://www.easypost.com/account/api-keys))
- **Veeqo API Key** ([Get one here](https://app.veeqo.com/settings/users))

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd perplexity

# Run the automated setup script
./scripts/setup.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit with your API keys
nano .env
```

**Required Configuration:**
```env
EASYPOST_API_KEY=your_easypost_api_key_here
VEEQO_API_KEY=your_veeqo_api_key_here
```

### 3. Start Development Servers

```bash
# Start all services
pnpm run dev

# Or start individually
pnpm run dev:easypost  # EasyPost MCP Server
pnpm run dev:veeqo     # Veeqo MCP Server  
pnpm run dev:web       # Web Interface
```

### 4. Access the Application

- **Web Interface**: http://localhost:3003
- **EasyPost MCP Health**: http://localhost:3000/health
- **Veeqo MCP Health**: http://localhost:3002/health

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Services

- **Redis**: Port 6379 (Caching)
- **PostgreSQL**: Port 5432 (Database)
- **EasyPost MCP**: Port 3000
- **Veeqo MCP**: Port 3002
- **Web Interface**: Port 3003
- **Prometheus**: Port 9090 (Optional)
- **Grafana**: Port 3001 (Optional)

## 🛠️ Development

### GitHub Copilot Integration

This repository is fully configured for GitHub Copilot with:
- **Comprehensive project context** in `.github/copilot-instructions.md`
- **VS Code workspace configuration** with optimized settings
- **Code snippets** for common MCP patterns
- **Debug configurations** for all services
- **Security exclusions** via `.copilotignore`

**Getting Started with Copilot:**
```bash
# Install required extensions
code --install-extension github.copilot
code --install-extension github.copilot-chat

# Open the configured workspace
code .vscode/perplexity-mcp.code-workspace
```

See [GitHub Copilot Guide](./docs/github-copilot-guide.md) for detailed usage instructions.

### Project Structure

```
perplexity/
├── easypost/                 # EasyPost MCP Server
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
├── veeqo/                    # Veeqo MCP Server
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
├── web/                      # Web Interface
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── package.json
├── scripts/                  # Setup and utility scripts
├── docker-compose.yml        # Docker configuration
├── nginx.conf               # Nginx configuration
└── package.json             # Root package.json
```

### Available Scripts

```bash
# Development
pnpm run dev                  # Start all services in development mode
pnpm run dev:easypost        # Start EasyPost MCP Server only
pnpm run dev:veeqo           # Start Veeqo MCP Server only
pnpm run dev:web             # Start Web Interface only

# Building
pnpm run build               # Build all services
pnpm run build:easypost      # Build EasyPost MCP Server
pnpm run build:veeqo         # Build Veeqo MCP Server

# Testing
pnpm run test                # Run all tests
pnpm run test:easypost       # Test EasyPost MCP Server
pnpm run test:veeqo          # Test Veeqo MCP Server

# Docker
pnpm run docker:build        # Build Docker images
pnpm run docker:up           # Start Docker services
pnpm run docker:down         # Stop Docker services
pnpm run docker:logs         # View Docker logs

# Utilities
pnpm run lint                # Lint all code
pnpm run format              # Format all code
pnpm run clean               # Clean all build artifacts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EASYPOST_API_KEY` | EasyPost API key | - | ✅ |
| `VEEQO_API_KEY` | Veeqo API key | - | ✅ |
| `NODE_ENV` | Environment mode | development | ❌ |
| `LOG_LEVEL` | Logging level | info | ❌ |
| `ENABLE_CACHE` | Enable Redis caching | false | ❌ |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 | ❌ |
| `ENABLE_WEBHOOKS` | Enable webhook support | true | ❌ |
| `WEBHOOK_PORT` | Webhook server port | 3001 | ❌ |
| `WEBHOOK_SECRET` | Webhook signature secret | - | ❌ |

### Port Configuration

| Service | Default Port | Environment Variable |
|---------|--------------|---------------------|
| EasyPost MCP | 3000 | `EASYPOST_PORT` |
| Veeqo MCP | 3002 | `VEEQO_PORT` |
| Web Interface | 3003 | `WEB_PORT` |
| Webhooks | 3001 | `WEBHOOK_PORT` |
| Redis | 6379 | - |
| PostgreSQL | 5432 | - |

## 📊 Monitoring & Observability

### Health Checks

All services provide health check endpoints:

```bash
# EasyPost MCP Server
curl http://localhost:3000/health

# Veeqo MCP Server
curl http://localhost:3002/health

# Web Interface
curl http://localhost:3003/health
```

### Metrics (Optional)

Enable Prometheus and Grafana for advanced monitoring:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3001
# Default credentials: admin/admin
```

### Logging

All services use structured JSON logging with contextual metadata:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Shipment created successfully",
  "service": "easypost-mcp-server",
  "shipmentId": "shp_123",
  "duration": 150
}
```

## 🧪 Testing

### Run Tests

```bash
# All tests
pnpm test

# Individual services
pnpm run test:easypost
pnpm run test:veeqo

# With coverage
pnpm run test:coverage
```

### Test Configuration

- **Jest** for test framework
- **Nock** for HTTP mocking
- **Supertest** for integration testing
- **Coverage threshold**: 70% for all metrics

## 🚀 Production Deployment

### Environment Setup

```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=info
ENABLE_CACHE=true
REDIS_URL=redis://your-redis-url:6379
```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Security Considerations

- ✅ Non-root Docker users
- ✅ API key validation and rotation
- ✅ Rate limiting and request size limits
- ✅ Input validation and sanitization
- ✅ Webhook signature verification
- ✅ Secure logging (no sensitive data)
- ✅ HTTPS/TLS enforcement

## 🐛 Troubleshooting

### Common Issues

**1. API Key Errors**
```bash
# Verify EasyPost API key
curl -H "Authorization: Bearer YOUR_KEY" https://api.easypost.com/v2/account

# Verify Veeqo API key
curl -H "x-api-key: YOUR_KEY" https://api.veeqo.com/current_user
```

**2. Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003
```

**3. Docker Issues**
```bash
# Check Docker status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

**4. Database Connection**
```bash
# Test PostgreSQL connection
docker-compose exec postgres psql -U perplexity -d perplexity_mcp -c "SELECT 1;"

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug pnpm run dev

# Enable verbose output
DEBUG_MODE=true pnpm run dev
```

## 📚 API Documentation

### EasyPost MCP Server

- **Tools**: 6 comprehensive shipping tools
- **Resources**: Account and carrier information
- **Documentation**: [./easypost/README.md](./easypost/README.md)

### Veeqo MCP Server

- **Tools**: 15+ inventory and order management tools
- **Resources**: Account, stores, warehouses, channels
- **Webhooks**: Real-time event processing
- **Documentation**: [./veeqo/README.md](./veeqo/README.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add my feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Submit a Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **EasyPost** for comprehensive shipping APIs
- **Veeqo** for advanced inventory management
- **Model Context Protocol** team for the MCP specification
- **TypeScript** and **Node.js** communities for excellent tooling

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/mcp-shipping/perplexity-suite/wiki)
- **Issues**: [GitHub Issues](https://github.com/mcp-shipping/perplexity-suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcp-shipping/perplexity-suite/discussions)

---

**Built with ❤️ by the MCP Shipping Suite Team**

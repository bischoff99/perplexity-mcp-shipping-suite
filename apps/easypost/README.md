# EasyPost MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--06-orange)](https://modelcontextprotocol.io/)

A production-ready **Model Context Protocol (MCP) server** for **EasyPost API** integration, built with TypeScript and designed for enterprise-scale shipping automation.

## 🚀 Features

### Core MCP Implementation
- ✅ **JSON-RPC 2.0 Compliant** - Full MCP protocol implementation
- ✅ **Six Comprehensive Tools** - Complete EasyPost API coverage
- ✅ **Resource Management** - Account and carrier information access
- ✅ **Error Handling** - Robust error management with detailed logging
- ✅ **Type Safety** - Strict TypeScript with Zod validation

### EasyPost API Integration
- 🚚 **Shipment Management** - Create, rate, purchase, and track shipments
- 📍 **Address Validation** - USPS address verification and normalization
- 💰 **Rate Shopping** - Compare rates across multiple carriers
- 🏷️ **Label Generation** - Generate shipping labels in multiple formats
- 📦 **Package Tracking** - Real-time shipment tracking
- 🧠 **SmartRate Integration** - Time-in-transit estimates

### Production Features
- 🔒 **Security** - Input validation, API key management, error sanitization
- ⚡ **Performance** - Response caching, retry logic, <200ms target response times
- 📊 **Observability** - Structured logging, metrics, health checks
- 🐳 **Docker Ready** - Production-optimized containerization
- 🧪 **Comprehensive Testing** - Unit, integration, and E2E tests
- 🔄 **CI/CD** - GitHub Actions workflows

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (or **pnpm** 8.0.0+)
- **EasyPost API Key** ([Get one here](https://www.easypost.com/account/api-keys))
- **Docker** (optional, for containerized deployment)

## 🏃‍♂️ Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/mcp-shipping/easypost-mcp-server.git
cd easypost-mcp-server

# Install dependencies
npm install
# or
pnpm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your EasyPost API key
vim .env
```

**Required Environment Variables:**
```bash
EASYPOST_API_KEY=EZAK_test_your_api_key_here
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Development

```bash
# Start in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 4. Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f easypost-mcp

# Stop services
docker-compose down
```

## 🛠️ Available Tools

The MCP server provides six comprehensive tools for EasyPost API integration:

### 1. `create_shipment`
Create a new shipment with origin, destination, and package details.

```json
{
  "name": "create_shipment",
  "arguments": {
    "to_address": {
      "name": "John Doe",
      "street1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "from_address": {
      "name": "Acme Corp",
      "street1": "456 Market St",
      "city": "San Francisco", 
      "state": "CA",
      "zip": "94102",
      "country": "US"
    },
    "parcel": {
      "length": 10,
      "width": 8,
      "height": 4,
      "weight": 15.0
    }
  }
}
```

### 2. `get_shipment_rates`
Retrieve available shipping rates for a shipment.

```json
{
  "name": "get_shipment_rates",
  "arguments": {
    "shipmentId": "shp_1234567890abcdef"
  }
}
```

### 3. `buy_shipment_label`
Purchase a shipping label for a selected rate.

```json
{
  "name": "buy_shipment_label",
  "arguments": {
    "shipmentId": "shp_1234567890abcdef",
    "rateId": "rate_1234567890abcdef"
  }
}
```

### 4. `track_shipment`
Track a shipment using tracking code.

```json
{
  "name": "track_shipment", 
  "arguments": {
    "trackingCode": "1Z999AA1234567890",
    "carrier": "UPS"
  }
}
```

### 5. `validate_address`
Validate and normalize an address.

```json
{
  "name": "validate_address",
  "arguments": {
    "street1": "123 Main Street",
    "city": "San Francisco",
    "state": "CA", 
    "zip": "94105",
    "country": "US"
  }
}
```

### 6. `get_smartrate_estimates`
Get time-in-transit estimates using EasyPost SmartRate.

```json
{
  "name": "get_smartrate_estimates",
  "arguments": {
    "from_zip": "94105",
    "to_zip": "10001",
    "carriers": ["USPS", "UPS", "FedEx"]
  }
}
```

## 📚 Available Resources

### `easypost://account`
Access current EasyPost account information, balance, and settings.

### `easypost://carriers`  
Retrieve available shipping carriers and their capabilities.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run tests in Docker
docker-compose --profile testing up test-runner
```

### Test Coverage Requirements
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🏗️ Architecture

```
┌─────────────────────┐
│   MCP Client        │
│  (Claude, GPT, etc) │
└──────────┬──────────┘
           │ JSON-RPC 2.0
           │ over stdio
┌──────────▼──────────┐
│  EasyPost MCP       │
│     Server          │
├─────────────────────┤
│  • Tool Handlers    │
│  • Resource Mgmt    │
│  • Validation       │  
│  • Error Handling   │
│  • Caching          │
│  • Logging          │
└──────────┬──────────┘
           │ HTTPS/TLS
           │ REST API
┌──────────▼──────────┐
│   EasyPost API      │
│  api.easypost.com   │
└─────────────────────┘
```

### Key Components

- **MCP Server** - Core protocol implementation using `@modelcontextprotocol/sdk`
- **EasyPost Client** - HTTP client with retry logic, caching, and error handling
- **Handlers** - Business logic for each tool and resource
- **Validation** - Zod schemas for request/response validation
- **Logger** - Structured logging with Winston
- **Types** - Comprehensive TypeScript definitions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EASYPOST_API_KEY` | EasyPost API key | - | ✅ |
| `NODE_ENV` | Environment (development/production/test) | development | ❌ |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info | ❌ |
| `EASYPOST_TIMEOUT` | API timeout in milliseconds | 30000 | ❌ |
| `EASYPOST_RETRY_ATTEMPTS` | Number of retry attempts | 3 | ❌ |
| `ENABLE_CACHE` | Enable response caching | false | ❌ |
| `PORT` | HTTP server port (for health checks) | - | ❌ |

See [.env.example](.env.example) for complete configuration options.

### Server Configuration

```typescript
const config: EasyPostMCPServerConfig = {
  name: 'easypost-mcp-server',
  version: '1.0.0',
  apiKey: process.env.EASYPOST_API_KEY,
  environment: 'production',
  timeout: 30000,
  retryAttempts: 3,
  enableCache: true,
  logLevel: 'info',
  port: 3000 // Optional health check server
};
```

## 📊 Monitoring & Observability

### Health Checks

```bash
# Health check endpoint (if PORT is configured)
curl http://localhost:3000/health

# Response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400000,
  "version": "1.0.0",
  "service": "easypost-mcp-server",
  "dependencies": {
    "easypost": "healthy"
  }
}
```

### Metrics

```bash
# Metrics endpoint
curl http://localhost:3000/metrics

# Response  
{
  "uptime": 86400000,
  "memory": {...},
  "cpu": {...},
  "version": "1.0.0",
  "tools": [...],
  "resources": [...]
}
```

### Structured Logging

All logs are structured JSON with consistent fields:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info", 
  "message": "Shipment created successfully",
  "pid": 1234,
  "service": "easypost-mcp-server",
  "version": "1.0.0",
  "environment": "production",
  "shipmentId": "shp_123",
  "duration": 150,
  "rateCount": 5
}
```

### Monitoring Stack (Optional)

The included Docker Compose configuration provides:

- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization  
- **Redis** - Distributed caching
- **PostgreSQL** - Data persistence

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3001
```

## 🚢 Deployment

### Docker

```bash
# Build production image
docker build -t easypost-mcp:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e EASYPOST_API_KEY=your_key_here \
  -e NODE_ENV=production \
  easypost-mcp:latest
```

### Railway

```bash
# Deploy to Railway
railway up

# Configure environment variables in Railway dashboard
railway variables set EASYPOST_API_KEY=your_key_here
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: easypost-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: easypost-mcp
  template:
    metadata:
      labels:
        app: easypost-mcp
    spec:
      containers:
      - name: easypost-mcp
        image: easypost-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: EASYPOST_API_KEY
          valueFrom:
            secretKeyRef:
              name: easypost-secret
              key: api-key
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🔐 Security

### API Key Management
- Never commit API keys to version control
- Use environment variables for configuration
- Rotate keys regularly
- Use test keys for development/testing
- Use production keys only in production

### Input Validation
- All inputs validated with Zod schemas
- Request size limits enforced
- Malicious input sanitization
- Type-safe error handling

### Transport Security
- HTTPS/TLS for all EasyPost API communication
- Secure headers with Helmet.js
- CORS configuration
- Rate limiting protection

## 🐛 Troubleshooting

### Common Issues

#### 1. Invalid API Key
```
Error: Unauthorized - Invalid or missing API key
```
**Solution**: Verify your EasyPost API key is correct and active.

#### 2. Connection Timeout  
```
Error: Request timeout
```
**Solution**: Check network connectivity and increase `EASYPOST_TIMEOUT`.

#### 3. Rate Limiting
```
Error: Too Many Requests - Rate limit exceeded
```
**Solution**: Implement exponential backoff or reduce request frequency.

#### 4. Address Validation Failures
```
Error: Address validation failed
```
**Solution**: Ensure address fields are complete and formatted correctly.

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Enable verbose output
DEBUG_MODE=true npm run dev
```

### Log Analysis

```bash
# View structured logs
tail -f logs/combined.log | jq .

# Filter error logs  
tail -f logs/error.log | jq 'select(.level == "error")'

# Monitor performance
tail -f logs/combined.log | jq 'select(.performance == true)'
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/easypost-mcp-server.git
cd easypost-mcp-server

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and add tests
npm run test

# Lint and format code
npm run lint:fix
npm run format

# Commit changes
git commit -m "feat: your feature description"

# Push and create a pull request
git push origin feature/your-feature-name
```

### Code Standards

- **TypeScript** - Strict mode enabled
- **ESLint** - Airbnb configuration
- **Prettier** - Consistent formatting
- **Jest** - Comprehensive testing
- **Conventional Commits** - Semantic commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [EasyPost](https://www.easypost.com/) - Shipping API platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification
- [Anthropic](https://www.anthropic.com/) - MCP framework creators

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/mcp-shipping/easypost-mcp-server/wiki)
- **Issues**: [GitHub Issues](https://github.com/mcp-shipping/easypost-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcp-shipping/easypost-mcp-server/discussions)
- **EasyPost Support**: [EasyPost Help Center](https://support.easypost.com/)

## 📈 Roadmap

- [ ] **v1.1**: Webhook support for real-time tracking updates
- [ ] **v1.2**: Batch processing for high-volume operations  
- [ ] **v1.3**: Advanced rate filtering and optimization
- [ ] **v1.4**: Multi-tenant support with account isolation
- [ ] **v2.0**: GraphQL interface for modern integrations

---

**Built with ❤️ for the shipping automation community**
# Veeqo MCP Server

[![Build Status](https://github.com/mcp-shipping/veeqo-mcp-server/workflows/CI/badge.svg)](https://github.com/mcp-shipping/veeqo-mcp-server/actions)
[![Coverage Status](https://codecov.io/gh/mcp-shipping/veeqo-mcp-server/branch/main/graph/badge.svg)](https://codecov.io/gh/mcp-shipping/veeqo-mcp-server)
[![npm version](https://badge.fury.io/js/@mcp-shipping%2Fveeqo-mcp-server.svg)](https://badge.fury.io/js/@mcp-shipping%2Fveeqo-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready **Model Context Protocol (MCP) Server** for comprehensive **Veeqo API integration**. Enables seamless inventory management, order processing, and real-time webhook support for e-commerce automation.

## 🚀 Features

### **Core Functionality**
- ✅ **Complete Veeqo API Integration** - Orders, products, inventory, customers, warehouses, shipments
- ✅ **JSON-RPC 2.0 Compliant** - Full MCP specification implementation  
- ✅ **Real-time Webhook Support** - Inventory updates, order changes, product modifications
- ✅ **Production-Grade Performance** - <200ms response times with caching and rate limiting
- ✅ **Enterprise Security** - Input validation, API key management, audit logging

### **Technical Excellence**
- 🔧 **TypeScript** - Strict type checking with comprehensive schemas
- 🐳 **Docker Ready** - Multi-stage containerization for all environments
- 🧪 **Comprehensive Testing** - Unit, integration, E2E, and performance tests
- 📊 **Observability** - Structured logging, metrics, health checks, distributed tracing
- 🚀 **High Performance** - Request caching, connection pooling, retry logic

### **Veeqo API Coverage**
- 📦 **Order Management** - Create, read, update orders with full lifecycle support
- 🏷️ **Product Management** - Products, variants, SKUs, images, and categories  
- 📊 **Inventory Management** - Stock levels, warehouses, allocations, transfers
- 👥 **Customer Management** - Customer profiles, addresses, order history
- 🚚 **Shipping & Fulfillment** - Carriers, rates, labels, tracking, allocations
- 🏪 **Multi-channel Support** - Stores, channels, marketplace integrations

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher  
- **Veeqo Account** with API access enabled
- **Redis** (optional, for distributed caching)
- **Docker** (optional, for containerized deployment)

## 🚀 Quick Start

### 1. **Installation**

```bash
# Install globally
npm install -g @mcp-shipping/veeqo-mcp-server

# Or install locally
npm install @mcp-shipping/veeqo-mcp-server
```

### 2. **Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Essential Configuration:**
```env
# Required
VEEQO_API_KEY=your_veeqo_api_key_here
NODE_ENV=production

# Optional but recommended
ENABLE_CACHE=true
REDIS_URL=redis://localhost:6379
ENABLE_WEBHOOKS=true
WEBHOOK_PORT=3001
WEBHOOK_SECRET=your_secure_webhook_secret
```

### 3. **Get Your Veeqo API Key**

1. Login to your [Veeqo account](https://app.veeqo.com)
2. Go to **Settings** → **Users** → **[Your User]** 
3. Click **"Refresh API Key"** to generate a new key
4. Copy the generated key to your `.env` file

### 4. **Start the Server**

```bash
# Development mode
npm run dev

# Production mode  
npm start

# With Docker
docker run -p 3000:3000 -p 3001:3001 --env-file .env veeqo-mcp
```

### 5. **Verify Installation**

```bash
# Health check
curl http://localhost:3000/health

# MCP server info (via stdio)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | veeqo-mcp
```

## 🔧 Configuration

### **Environment Variables**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VEEQO_API_KEY` | ✅ | - | Your Veeqo API key |
| `NODE_ENV` | - | `development` | Environment mode |
| `VEEQO_API_URL` | - | `https://api.veeqo.com` | Veeqo API base URL |
| `PORT` | - | `3000` | HTTP server port |
| `WEBHOOK_PORT` | - | `3001` | Webhook server port |
| `ENABLE_CACHE` | - | `false` | Enable response caching |
| `REDIS_URL` | - | - | Redis connection string |
| `LOG_LEVEL` | - | `info` | Logging level |

See [.env.example](.env.example) for complete configuration options.

### **Webhook Configuration**

To enable real-time updates from Veeqo:

```env
ENABLE_WEBHOOKS=true
WEBHOOK_PORT=3001
WEBHOOK_SECRET=your_secure_32_char_secret
```

**Webhook URL:** `https://your-domain.com:3001/webhook`

**Supported Events:**
- Order created, updated, shipped, cancelled
- Product created, updated, deleted  
- Inventory level changes, low stock alerts
- Customer created, updated
- Shipment created, delivered

## 🛠️ Usage Examples

### **MCP Tools Available**

#### **Order Management**
```javascript
// Create a new order
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_order",
    "arguments": {
      "deliver_to": {
        "first_name": "John",
        "last_name": "Doe", 
        "address_line_1": "123 Main St",
        "city": "London",
        "region": "England", 
        "country": "GB",
        "post_code": "SW1A 1AA"
      },
      "customer": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "line_items": [
        {
          "sellable_id": 12345,
          "quantity": 2,
          "price_per_unit": 29.99
        }
      ]
    }
  }
}

// Get orders with filters
{
  "name": "get_orders",
  "arguments": {
    "status": "awaiting_fulfillment",
    "created_at_min": "2024-01-01",
    "page_size": 50
  }
}
```

#### **Product Management**
```javascript
// Create a product with variants
{
  "name": "create_product",
  "arguments": {
    "title": "Premium T-Shirt",
    "description": "High-quality cotton t-shirt",
    "sellables": [
      {
        "title": "Premium T-Shirt - Small - Red",
        "sku_code": "TSHIRT-S-RED",
        "price": 24.99,
        "cost_price": 12.00,
        "weight_grams": 150
      }
    ]
  }
}

// Update inventory levels
{
  "name": "update_inventory", 
  "arguments": {
    "sellable_id": 12345,
    "warehouse_id": 1,
    "physical_stock_level": 100
  }
}
```

#### **Customer Management**
```javascript
// Create a customer
{
  "name": "create_customer",
  "arguments": {
    "first_name": "Jane",
    "last_name": "Smith", 
    "email": "jane@example.com",
    "phone_number": "+44 20 1234 5678"
  }
}
```

### **MCP Resources Available**

- `veeqo://account` - Current account information
- `veeqo://stores` - Connected stores and channels  
- `veeqo://warehouses` - Warehouse locations and settings
- `veeqo://channels` - Sales channel configurations

## 🐳 Docker Deployment

### **Basic Deployment**

```bash
# Build image
docker build -t veeqo-mcp .

# Run container
docker run -d \
  --name veeqo-mcp \
  -p 3000:3000 \
  -p 3001:3001 \
  -e VEEQO_API_KEY=your_api_key \
  --restart unless-stopped \
  veeqo-mcp
```

### **Docker Compose**

```yaml
version: '3.8'
services:
  veeqo-mcp:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - VEEQO_API_KEY=${VEEQO_API_KEY}
      - REDIS_URL=redis://redis:6379
      - ENABLE_CACHE=true
      - ENABLE_WEBHOOKS=true
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

## 🧪 Testing

### **Run Tests**

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests  
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### **Test Configuration**

Tests use:
- **Jest** for test framework
- **Nock** for HTTP mocking
- **Supertest** for integration testing
- **Coverage threshold**: 70% for all metrics

## 📊 Monitoring & Observability

### **Health Checks**

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed metrics
curl http://localhost:3000/metrics
```

### **Structured Logging**

Logs are output in JSON format with contextual metadata:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Order created successfully",
  "orderId": 12345,
  "customerId": 67890,
  "duration": 142,
  "service": "veeqo-mcp-server"
}
```

### **Performance Monitoring**

- **Response Times**: <200ms target with performance logging
- **Rate Limiting**: Respects Veeqo's 5 requests/second limit
- **Caching**: Configurable TTL with Redis support
- **Error Tracking**: Comprehensive error logging and alerting

## 🔧 Development

### **Local Development Setup**

```bash
# Clone repository
git clone https://github.com/mcp-shipping/veeqo-mcp-server.git
cd veeqo-mcp-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### **Project Structure**

```
src/
├── index.ts              # Application entry point
├── server.ts             # MCP server implementation  
├── handlers/
│   ├── veeqo.ts         # Veeqo API handlers
│   └── webhooks.ts      # Webhook handlers
├── services/
│   ├── veeqo-client.ts  # HTTP client with rate limiting
│   └── webhook-manager.ts # Webhook management
├── types/
│   ├── index.ts         # Main type definitions
│   └── veeqo-api.ts     # Veeqo API types
└── utils/
    ├── logger.ts        # Winston logger configuration  
    └── validation.ts    # Zod validation schemas

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests  
└── e2e/                # End-to-end tests
```

### **Code Quality**

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking  
npm run typecheck

# Formatting
npm run format
npm run format:check

# Pre-commit checks
npm run precommit
```

## 🚀 Production Deployment

### **Railway Deployment**

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### **Environment-Specific Configuration**

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_CACHE=true
REDIS_URL=redis://your-redis-url:6379
ENABLE_WEBHOOKS=true
```

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CACHE=false
ENABLE_WEBHOOKS=false
```

### **Security Considerations**

- ✅ Non-root Docker user
- ✅ API key validation and rotation
- ✅ Rate limiting and request size limits
- ✅ Input validation and sanitization
- ✅ Webhook signature verification
- ✅ Secure logging (no sensitive data)
- ✅ HTTPS/TLS enforcement

## 🔧 API Reference

### **Available MCP Tools**

| Tool | Description | Parameters |
|------|-------------|------------|
| `create_order` | Create new order | `deliver_to`, `customer`, `line_items` |
| `get_orders` | List orders with filters | `status`, `page`, `created_at_min` |
| `get_order` | Get specific order | `orderId` |
| `update_order` | Update existing order | `orderId`, `updates` |
| `create_product` | Create new product | `title`, `sellables`, `description` |
| `get_products` | List products with filters | `page`, `query`, `created_at_min` |
| `get_product` | Get specific product | `productId` |
| `update_product` | Update existing product | `productId`, `updates` |
| `get_inventory` | Get inventory levels | `warehouse_id`, `sellable_id` |
| `update_inventory` | Update stock levels | `sellable_id`, `warehouse_id`, `physical_stock_level` |
| `create_customer` | Create new customer | `first_name`, `last_name`, `email` |
| `get_customers` | List customers | `page`, `query` |
| `get_warehouses` | List warehouses | - |
| `get_shipments` | List shipments | `order_id`, `page` |

See the [API Documentation](docs/api.md) for detailed parameter schemas.

## 🐛 Troubleshooting

### **Common Issues**

**Issue: "Invalid API key" error**
```bash
# Verify your API key
curl -H "x-api-key: YOUR_KEY" https://api.veeqo.com/current_user
```

**Issue: Rate limit exceeded**
```bash
# Check rate limit headers
curl -I -H "x-api-key: YOUR_KEY" https://api.veeqo.com/orders
```

**Issue: Webhook signature validation fails**
```bash
# Verify webhook secret matches Veeqo configuration
# Check webhook signature in request headers
```

**Issue: Redis connection errors**
```bash
# Test Redis connection
redis-cli -u redis://localhost:6379 ping
```

### **Debug Mode**

```env
LOG_LEVEL=debug
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add my feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Submit a Pull Request

### **Code Standards**

- TypeScript with strict mode
- ESLint + Prettier for formatting
- 70% test coverage minimum
- Conventional commit messages
- Documentation for new features

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Veeqo** for providing comprehensive inventory management APIs
- **Model Context Protocol** team for the MCP specification
- **TypeScript** and **Node.js** communities for excellent tooling
- **Contributors** who have helped improve this project

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/mcp-shipping/veeqo-mcp-server/wiki)
- **Issues**: [GitHub Issues](https://github.com/mcp-shipping/veeqo-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcp-shipping/veeqo-mcp-server/discussions)
- **Security**: [Security Policy](SECURITY.md)

---

**Built with ❤️ by the MCP Shipping Suite Team**

[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mcp-shipping/veeqo-mcp-server&type=Date)](https://star-history.com/#mcp-shipping/veeqo-mcp-server&Date)
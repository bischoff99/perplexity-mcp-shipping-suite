# API Documentation

## Overview

The Perplexity MCP Shipping Suite provides comprehensive APIs for shipping automation and inventory management through Model Context Protocol (MCP) servers.

## MCP Servers

### EasyPost MCP Server
- **Port**: 3000
- **Health**: http://localhost:3000/health
- **Tools**: 6 shipping automation tools
- **Resources**: Account and carrier information

### Veeqo MCP Server
- **Port**: 3002
- **Health**: http://localhost:3002/health
- **Tools**: 19 inventory and order management tools
- **Resources**: Account, stores, warehouses, channels

## EasyPost API Tools

### 1. `create_shipment`
Create a new shipment with origin, destination, and package details.

**Parameters:**
```json
{
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
```

**Response:**
```json
{
  "id": "shp_1234567890abcdef",
  "object": "Shipment",
  "to_address": { ... },
  "from_address": { ... },
  "parcel": { ... },
  "rates": [ ... ]
}
```

### 2. `get_shipment_rates`
Retrieve available shipping rates for a shipment.

**Parameters:**
```json
{
  "shipmentId": "shp_1234567890abcdef"
}
```

**Response:**
```json
{
  "rates": [
    {
      "id": "rate_1234567890abcdef",
      "object": "Rate",
      "service": "Ground",
      "carrier": "UPS",
      "rate": "8.45",
      "currency": "USD",
      "retail_rate": "12.45",
      "list_rate": "8.45",
      "delivery_days": 3,
      "delivery_date": "2024-01-18T00:00:00Z"
    }
  ]
}
```

### 3. `buy_shipment_label`
Purchase a shipping label for a selected rate.

**Parameters:**
```json
{
  "shipmentId": "shp_1234567890abcdef",
  "rateId": "rate_1234567890abcdef"
}
```

**Response:**
```json
{
  "id": "shp_1234567890abcdef",
  "object": "Shipment",
  "postage_label": {
    "id": "pl_1234567890abcdef",
    "object": "PostageLabel",
    "label_url": "https://easypost-files.s3-us-west-2.amazonaws.com/files/postage_label/20240115/pl_1234567890abcdef.pdf",
    "label_date": "2024-01-15T10:30:00Z",
    "label_epl2_url": "https://easypost-files.s3-us-west-2.amazonaws.com/files/postage_label/20240115/pl_1234567890abcdef.epl2"
  },
  "tracking_code": "1Z999AA1234567890"
}
```

### 4. `track_shipment`
Track a shipment using tracking code.

**Parameters:**
```json
{
  "trackingCode": "1Z999AA1234567890",
  "carrier": "UPS"
}
```

**Response:**
```json
{
  "id": "trk_1234567890abcdef",
  "object": "Tracker",
  "tracking_code": "1Z999AA1234567890",
  "status": "in_transit",
  "status_detail": "arrived_at_destination",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T14:22:00Z",
  "signed_by": null,
  "weight": 15.0,
  "est_delivery_date": "2024-01-18T00:00:00Z",
  "shipment_id": "shp_1234567890abcdef",
  "carrier": "UPS",
  "tracking_details": [
    {
      "object": "TrackingDetail",
      "message": "Package arrived at destination facility",
      "description": "Package arrived at destination facility",
      "status": "in_transit",
      "status_detail": "arrived_at_destination",
      "datetime": "2024-01-16T14:22:00Z",
      "source": "UPS",
      "tracking_location": {
        "object": "TrackingLocation",
        "city": "San Francisco",
        "state": "CA",
        "country": "US",
        "zip": "94105"
      }
    }
  ]
}
```

### 5. `validate_address`
Validate and normalize an address.

**Parameters:**
```json
{
  "street1": "123 Main Street",
  "city": "San Francisco",
  "state": "CA", 
  "zip": "94105",
  "country": "US"
}
```

**Response:**
```json
{
  "id": "addr_1234567890abcdef",
  "object": "Address",
  "street1": "123 MAIN ST",
  "street2": null,
  "city": "SAN FRANCISCO",
  "state": "CA",
  "zip": "94105-1234",
  "country": "US",
  "verifications": {
    "zip4": {
      "success": true,
      "errors": []
    },
    "delivery": {
      "success": true,
      "errors": []
    }
  }
}
```

### 6. `get_smartrate_estimates`
Get time-in-transit estimates using EasyPost SmartRate.

**Parameters:**
```json
{
  "from_zip": "94105",
  "to_zip": "10001",
  "carriers": ["USPS", "UPS", "FedEx"]
}
```

**Response:**
```json
{
  "rates": [
    {
      "carrier": "UPS",
      "service": "Ground",
      "rate": 8.45,
      "currency": "USD",
      "delivery_days": 3,
      "delivery_date": "2024-01-18T00:00:00Z"
    },
    {
      "carrier": "USPS",
      "service": "Priority Mail",
      "rate": 7.50,
      "currency": "USD",
      "delivery_days": 2,
      "delivery_date": "2024-01-17T00:00:00Z"
    }
  ]
}
```

## Veeqo API Tools

### Order Management

#### `create_order`
Create a new customer order.

**Parameters:**
```json
{
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
```

#### `get_orders`
Retrieve orders with filtering options.

**Parameters:**
```json
{
  "status": "awaiting_fulfillment",
  "created_at_min": "2024-01-01",
  "page_size": 50
}
```

#### `get_order`
Get detailed order information.

**Parameters:**
```json
{
  "orderId": 12345
}
```

#### `update_order`
Update existing order.

**Parameters:**
```json
{
  "orderId": 12345,
  "updates": {
    "status": "shipped",
    "tracking_number": "1Z999AA1234567890"
  }
}
```

### Product Management

#### `create_product`
Create a new product with variants.

**Parameters:**
```json
{
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
```

#### `get_products`
List products with filters.

**Parameters:**
```json
{
  "page": 1,
  "query": "t-shirt",
  "created_at_min": "2024-01-01"
}
```

#### `get_product`
Get specific product details.

**Parameters:**
```json
{
  "productId": 12345
}
```

#### `update_product`
Update existing product.

**Parameters:**
```json
{
  "productId": 12345,
  "updates": {
    "title": "Updated Product Title",
    "price": 29.99
  }
}
```

### Inventory Management

#### `get_inventory`
Get inventory levels across warehouses.

**Parameters:**
```json
{
  "warehouse_id": 1,
  "sellable_id": 12345
}
```

#### `update_inventory`
Update stock levels.

**Parameters:**
```json
{
  "sellable_id": 12345,
  "warehouse_id": 1,
  "physical_stock_level": 100
}
```

#### `get_stock_entries`
View stock movement history.

**Parameters:**
```json
{
  "sellable_id": 12345,
  "warehouse_id": 1
}
```

#### `get_allocations`
Check inventory allocations.

**Parameters:**
```json
{
  "warehouse_id": 1
}
```

### Customer Management

#### `create_customer`
Create a new customer.

**Parameters:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith", 
  "email": "jane@example.com",
  "phone_number": "+44 20 1234 5678"
}
```

#### `get_customers`
List customers with filters.

**Parameters:**
```json
{
  "page": 1,
  "query": "jane"
}
```

#### `get_customer`
Get customer details.

**Parameters:**
```json
{
  "customerId": 12345
}
```

### Warehouse Management

#### `get_warehouses`
List all warehouses.

**Parameters:**
```json
{}
```

#### `get_warehouse`
Get warehouse details.

**Parameters:**
```json
{
  "warehouseId": 1
}
```

#### `get_shipments`
View warehouse shipments.

**Parameters:**
```json
{
  "order_id": 12345,
  "page": 1
}
```

## MCP Resources

### EasyPost Resources
- `easypost://account` - Current account information, balance, and settings
- `easypost://carriers` - Available shipping carriers and their capabilities

### Veeqo Resources
- `veeqo://account` - Current account information
- `veeqo://stores` - Connected stores and channels
- `veeqo://warehouses` - Warehouse locations and settings
- `veeqo://channels` - Sales channel configurations

## Error Handling

### Standard Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Missing required field: to_address"
    }
  }
}
```

### Common Error Codes
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error
- `-32001`: API key invalid
- `-32002`: Rate limit exceeded

## Rate Limiting

### EasyPost
- Built-in retry with exponential backoff
- No explicit rate limits documented
- Recommended: 1 request per second

### Veeqo
- **5 requests per second** enforced
- Automatic rate limiting with Bottleneck library
- 429 status code when limit exceeded

## Authentication

### EasyPost
```bash
# API Key in Authorization header
curl -H "Authorization: Bearer EZAK_test_your_api_key_here" \
     https://api.easypost.com/v2/account
```

### Veeqo
```bash
# API Key in x-api-key header
curl -H "x-api-key: your_veeqo_api_key_here" \
     https://api.veeqo.com/current_user
```

## Webhooks

### Veeqo Webhooks
Supported events:
- Order created, updated, shipped, cancelled
- Product created, updated, deleted
- Inventory level changes, low stock alerts
- Customer created, updated
- Shipment created, delivered

**Webhook URL:** `https://your-domain.com:3001/webhook`

**Configuration:**
```env
ENABLE_WEBHOOKS=true
WEBHOOK_PORT=3001
WEBHOOK_SECRET=your_secure_32_char_secret
```

## Testing

### Health Checks
```bash
# EasyPost MCP Server
curl http://localhost:3000/health

# Veeqo MCP Server
curl http://localhost:3002/health
```

### MCP Protocol Testing
```bash
# List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js

# Call a tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"validate_address","arguments":{"street1":"123 Main St","city":"San Francisco","state":"CA","zip":"94105","country":"US"}}}' | node dist/index.js
```

## Performance

### Response Times
- **Target**: <200ms average response time
- **Caching**: Configurable TTL with Redis support
- **Connection Pooling**: Optimized HTTP connections
- **Retry Logic**: Exponential backoff for failed requests

### Monitoring
- Structured JSON logging with correlation IDs
- Health check endpoints for all services
- Prometheus metrics (optional)
- Grafana dashboards (optional)

## Security

### Input Validation
- All inputs validated with Zod schemas
- Request size limits enforced
- Malicious input sanitization
- Type-safe error handling

### API Security
- Secure headers with Helmet.js
- CORS configuration
- Rate limiting protection
- Environment variable validation

## Examples

### Complete Shipping Workflow
```javascript
// 1. Create shipment
const shipment = await mcpClient.call('create_shipment', {
  to_address: { /* address */ },
  from_address: { /* address */ },
  parcel: { /* dimensions */ }
});

// 2. Get rates
const rates = await mcpClient.call('get_shipment_rates', {
  shipmentId: shipment.id
});

// 3. Buy label
const label = await mcpClient.call('buy_shipment_label', {
  shipmentId: shipment.id,
  rateId: rates.rates[0].id
});

// 4. Track shipment
const tracking = await mcpClient.call('track_shipment', {
  trackingCode: label.tracking_code,
  carrier: rates.rates[0].carrier
});
```

### Inventory Management Workflow
```javascript
// 1. Check inventory
const inventory = await mcpClient.call('get_inventory', {
  warehouse_id: 1,
  sellable_id: 12345
});

// 2. Update stock
await mcpClient.call('update_inventory', {
  sellable_id: 12345,
  warehouse_id: 1,
  physical_stock_level: 100
});

// 3. Create order
const order = await mcpClient.call('create_order', {
  deliver_to: { /* address */ },
  customer: { /* customer */ },
  line_items: [{ sellable_id: 12345, quantity: 2 }]
});
```

## Support

- **Documentation**: [GitHub Wiki](https://github.com/mcp-shipping/perplexity-suite/wiki)
- **Issues**: [GitHub Issues](https://github.com/mcp-shipping/perplexity-suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcp-shipping/perplexity-suite/discussions)
- **EasyPost Support**: [EasyPost Help Center](https://support.easypost.com/)
- **Veeqo Support**: [Veeqo Documentation](https://docs.veeqo.com/)

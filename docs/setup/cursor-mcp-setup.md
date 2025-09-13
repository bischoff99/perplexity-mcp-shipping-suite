# 🎯 Cursor MCP Setup Guide

## Adding MCP Servers to Cursor

This guide will help you configure Cursor to use both EasyPost and Veeqo MCP servers for AI-powered shipping and inventory automation.

---

## 📋 Prerequisites

Ensure both MCP servers are built and running:

```bash
# Build both servers
cd easypost && npm run build
cd ../veeqo && npm run build

# Start both servers (optional - for testing)
cd easypost && npm run dev &
cd ../veeqo && npm run dev &
```

---

## ⚙️ Cursor Configuration

### Option 1: Global Configuration

Add to your global Cursor settings (`~/.cursor/mcp_settings.json`):

```json
{
  "mcpServers": {
    "easypost-shipping": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/home/bischoff666/Projects/perplexity/easypost",
      "env": {
        "NODE_ENV": "production"
      }
    },
    "veeqo-inventory": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/home/bischoff666/Projects/perplexity/veeqo",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Option 2: Project-Specific Configuration

Add to your project's `.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "easypost-shipping": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "./easypost",
      "env": {
        "NODE_ENV": "development"
      }
    },
    "veeqo-inventory": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "./veeqo",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

---

## 🛠️ Available MCP Tools (52 Total)

### EasyPost MCP Server (15 Tools)
**Shipping Automation & Logistics**

#### Core Operations
- `create_shipment` - Create new shipments with carrier selection
- `get_shipment_rates` - Get real-time shipping rates from multiple carriers
- `buy_shipment_label` - Purchase and generate shipping labels
- `track_shipment` - Track packages with real-time updates

#### Address Management
- `validate_address` - Validate and normalize shipping addresses
- `verify_address` - Advanced address verification with carrier validation

#### Advanced Features
- `get_smartrate_estimates` - Get intelligent delivery time predictions
- `refund_shipment` - Request refunds for shipped packages
- `buy_insurance` - Purchase shipment insurance coverage

#### Bulk Operations
- `create_batch` - Create batches for bulk shipment processing
- `add_shipments_to_batch` - Add multiple shipments to batches
- `buy_batch` - Purchase all shipments in a batch
- `scan_form_create` - Create SCAN forms for USPS efficiency

#### International Shipping
- `get_customs_info` - Retrieve customs information
- `create_customs_info` - Create customs info for international shipments

### Veeqo MCP Server (37 Tools)
**Enterprise Inventory & Order Management**

#### Order Management (4 tools)
- `create_order` - Create new customer orders
- `get_orders` - Retrieve orders with filtering options
- `get_order` - Get detailed order information
- `update_order` - Update existing orders

#### Product Management (4 tools)
- `create_product` - Add new products to catalog
- `get_products` - Retrieve product listings
- `get_product` - Get detailed product information
- `update_product` - Update product details

#### Inventory Management (4 tools)
- `get_inventory` - Check stock levels across warehouses
- `update_inventory` - Adjust inventory quantities
- `get_stock_entries` - View stock movement history
- `get_allocations` - Check inventory allocations

#### Customer Management (3 tools)
- `create_customer` - Add new customers
- `get_customers` - Retrieve customer lists
- `get_customer` - Get customer details

#### Warehouse Management (4 tools)
- `get_warehouses` - List all warehouses
- `get_warehouse` - Get warehouse details
- `get_shipments` - View warehouse shipments
- `create_shipment` - Create shipments within Veeqo system

#### Analytics & Reporting (4 tools)
- `get_sales_analytics` - Detailed sales metrics and insights
- `get_inventory_report` - Comprehensive inventory analysis
- `get_order_analytics` - Order patterns and trend analysis
- `get_product_performance` - Product-level performance metrics

#### Bulk Operations (5 tools)
- `bulk_update_inventory` - Update inventory levels for multiple products
- `bulk_create_products` - Create multiple products in one operation
- `bulk_update_prices` - Update prices across multiple products
- `export_orders` - Export order data to CSV/JSON/Excel
- `export_products` - Export product catalogs to various formats

#### Supply Chain Management (4 tools)
- `create_purchase_order` - Create purchase orders for restocking
- `get_purchase_orders` - Retrieve purchase order history
- `manage_suppliers` - Add, update, or manage supplier information
- `get_supplier_products` - Get products by supplier

#### Customer Service (2 tools)
- `create_return` - Create returns/RMA for products
- `process_refund` - Process customer refunds

#### Multi-Channel Integration (3 tools)
- `sync_channels` - Synchronize with sales channels (Amazon, eBay, etc.)
- `get_channel_listings` - Get product listings across channels
- `update_channel_inventory` - Update inventory on specific channels

---

## 🚀 Usage Examples

### Shipping Workflow
```
Create a shipment from San Francisco to New York for a 1lb package
```
*Cursor will use `create_shipment` tool with EasyPost integration*

### Inventory Management
```
Check inventory levels for all products in warehouse 1
```
*Cursor will use `get_inventory` tool with Veeqo integration*

### Analytics Query
```
Show me sales analytics for the last 30 days
```
*Cursor will use `get_sales_analytics` tool for business insights*

### Bulk Operations
```
Update inventory levels for 50 products from this CSV data
```
*Cursor will use `bulk_update_inventory` for efficient processing*

---

## 🔧 Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   - Ensure both servers are built: `npm run build` in each directory
   - Check the `cwd` path in your configuration
   - Verify `dist/index.js` exists in both directories

2. **Environment Variables Missing**
   - Check `.env` files exist in both `easypost` and `veeqo` directories
   - Ensure API keys are properly configured
   - Verify NODE_ENV is set correctly

3. **Tool Not Available**
   - Restart Cursor after adding MCP configuration
   - Check server logs for any startup errors
   - Verify tools are listed in server metrics: `curl localhost:3000/metrics`

### Health Check Commands
```bash
# Verify servers are healthy
curl http://localhost:3000/health  # EasyPost
curl http://localhost:3002/health  # Veeqo

# Check available tools
curl http://localhost:3000/metrics | jq .tools
curl http://localhost:3002/metrics | jq .tools
```

---

## 🎯 Integration Benefits

### For Cursor Users
- **52 AI-powered tools** for shipping and inventory automation
- **Production API integration** with real EasyPost and Veeqo services
- **Enterprise-grade capabilities** including bulk operations and analytics
- **Comprehensive error handling** with detailed validation
- **Real-time data** from live business systems

### Business Workflows Enabled
- **End-to-end shipping automation** from rate calculation to label generation
- **Complete inventory management** with multi-warehouse support
- **Advanced business analytics** and performance insights
- **Supply chain optimization** with purchase orders and supplier management
- **Multi-channel commerce** integration (Amazon, eBay, Shopify, etc.)
- **Customer service automation** with returns and refund processing

---

**🎉 Ready to use 52 MCP tools for AI-powered business automation in Cursor!**
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer, Server as HttpServer } from 'http';

import { logger } from './utils/logger.js';
import { VeeqoClient } from './services/veeqo-client.js';
import { VeeqoHandlers } from './handlers/veeqo.js';
import { WebhookManager } from './services/webhook-manager.js';
import { WebhookHandlers } from './handlers/webhooks.js';
import {
  VeeqoMCPServerConfig,
  ToolDefinition,
  ResourceDefinition,
  VeeqoError,
  HealthCheckResponse
} from './types/index.js';
import {
  validateOrderCreation,
  validateProductCreation,
  validateProductUpdate,
  validateInventoryUpdate,
  validateOrderSearch,
  validateProductSearch,
  validateCustomerCreation
} from './utils/validation.js';

/**
 * Production-ready Veeqo MCP Server
 * Implements Model Context Protocol for Veeqo API integration
 */
export class VeeqoMCPServer {
  private server: Server;
  private httpServer?: HttpServer;
  private webhookServer?: HttpServer;
  private app?: Express;
  private webhookApp?: Express;
  private config: VeeqoMCPServerConfig;
  private veeqoClient: VeeqoClient;
  private handlers: VeeqoHandlers;
  private webhookManager?: WebhookManager;
  private webhookHandlers?: WebhookHandlers;
  private isRunning = false;
  private startTime: Date;

  constructor(config: VeeqoMCPServerConfig) {
    this.config = config;
    this.startTime = new Date();
    
    // Initialize MCP server with metadata
    this.server = new Server(
      {
        name: config.name,
        version: config.version
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    // Initialize Veeqo client
    this.veeqoClient = new VeeqoClient({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      enableCache: config.enableCache,
      redisUrl: config.redisUrl ?? undefined
    });

    // Initialize handlers
    this.handlers = new VeeqoHandlers(this.veeqoClient);

    // Initialize webhook components if enabled
    if (config.enableWebhooks && config.webhookPort && config.webhookSecret) {
      this.webhookManager = new WebhookManager({
        veeqoClient: this.veeqoClient,
        secret: config.webhookSecret!,
        redisUrl: config.redisUrl ?? undefined
      });
      
      this.webhookHandlers = new WebhookHandlers(this.webhookManager);
    }

    // Setup MCP handlers
    this.setupMCPHandlers();

    // Setup HTTP server for health checks and metrics if port is provided
    if (config.port) {
      this.setupHttpServer();
    }

    // Setup webhook server if enabled
    if (config.enableWebhooks && config.webhookPort && this.webhookHandlers) {
      this.setupWebhookServer();
    }

    logger.info('Veeqo MCP Server initialized', {
      name: config.name,
      version: config.version,
      environment: config.environment,
      port: config.port,
      webhookPort: config.webhookPort,
      enableCache: config.enableCache,
      enableWebhooks: config.enableWebhooks
    });
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupMCPHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions()
      };
    });

    // List available resources  
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: this.getResourceDefinitions()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info('Tool called', {
          tool: name,
          arguments: args,
          requestId: (request as any).id
        });

        switch (name) {
          // Order Management Tools
          case 'create_order':
            return await this.handleCreateOrder(args);
          
          case 'get_orders':
            return await this.handleGetOrders(args);
          
          case 'get_order':
            return await this.handleGetOrder(args);
          
          case 'update_order':
            return await this.handleUpdateOrder(args);
          
          // Product Management Tools
          case 'create_product':
            return await this.handleCreateProduct(args);
          
          case 'get_products':
            return await this.handleGetProducts(args);
          
          case 'get_product':
            return await this.handleGetProduct(args);
          
          case 'update_product':
            return await this.handleUpdateProduct(args);
          
          // Inventory Management Tools
          case 'get_inventory':
            return await this.handleGetInventory(args);
          
          case 'update_inventory':
            return await this.handleUpdateInventory(args);
          
          case 'get_stock_entries':
            return await this.handleGetStockEntries(args);
          
          // Customer Management Tools
          case 'create_customer':
            return await this.handleCreateCustomer(args);
          
          case 'get_customers':
            return await this.handleGetCustomers(args);
          
          case 'get_customer':
            return await this.handleGetCustomer(args);
          
          // Warehouse/Location Management
          case 'get_warehouses':
            return await this.handleGetWarehouses(args);
          
          case 'get_warehouse':
            return await this.handleGetWarehouse(args);
          
          // Shipment Tools
          case 'get_shipments':
            return await this.handleGetShipments(args);
          
          case 'create_shipment':
            return await this.handleCreateShipment(args);
          
          case 'get_allocations':
            return await this.handleGetAllocations(args);

          // Analytics and Reporting Tools
          case 'get_sales_analytics':
            return await this.handleGetSalesAnalytics(args);

          case 'get_inventory_report':
            return await this.handleGetInventoryReport(args);

          case 'get_order_analytics':
            return await this.handleGetOrderAnalytics(args);

          case 'get_product_performance':
            return await this.handleGetProductPerformance(args);

          // Bulk Operations Tools
          case 'bulk_update_inventory':
            return await this.handleBulkUpdateInventory(args);

          case 'bulk_create_products':
            return await this.handleBulkCreateProducts(args);

          case 'bulk_update_prices':
            return await this.handleBulkUpdatePrices(args);

          case 'export_orders':
            return await this.handleExportOrders(args);

          case 'export_products':
            return await this.handleExportProducts(args);

          // Advanced Management Tools
          case 'create_purchase_order':
            return await this.handleCreatePurchaseOrder(args);

          case 'get_purchase_orders':
            return await this.handleGetPurchaseOrders(args);

          case 'manage_suppliers':
            return await this.handleManageSuppliers(args);

          case 'get_supplier_products':
            return await this.handleGetSupplierProducts(args);

          case 'create_return':
            return await this.handleCreateReturn(args);

          case 'process_refund':
            return await this.handleProcessRefund(args);

          // Integration and Sync Tools
          case 'sync_channels':
            return await this.handleSyncChannels(args);

          case 'get_channel_listings':
            return await this.handleGetChannelListings(args);

          case 'update_channel_inventory':
            return await this.handleUpdateChannelInventory(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        logger.error('Tool execution failed', {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          requestId: (request as any).id
        });

        if (error instanceof McpError) {
          throw error;
        }

        if (error instanceof VeeqoError) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Veeqo API error: ${error.message}`,
            error.details
          );
        }

        throw new McpError(
          ErrorCode.InternalError,
          'Internal server error occurred'
        );
      }
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        logger.info('Resource read requested', {
          uri,
          requestId: (request as any).id
        });

        if (uri === 'veeqo://account') {
          const account = await this.handlers.getCurrentUser();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(account, null, 2)
              }
            ]
          };
        }

        if (uri === 'veeqo://stores') {
          const stores = await this.handlers.getStores();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(stores, null, 2)
              }
            ]
          };
        }

        if (uri === 'veeqo://warehouses') {
          const warehouses = await this.handlers.getWarehouses();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(warehouses, null, 2)
              }
            ]
          };
        }

        if (uri === 'veeqo://channels') {
          const channels = await this.handlers.getChannels();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(channels, null, 2)
              }
            ]
          };
        }

        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown resource URI: ${uri}`
        );

      } catch (error) {
        logger.error('Resource read failed', {
          uri,
          error: error instanceof Error ? error.message : String(error),
          requestId: (request as any).id
        });

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          'Failed to read resource'
        );
      }
    });
  }

  /**
   * Setup HTTP server for health checks and metrics
   */
  private setupHttpServer(): void {
    this.app = express();

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));
    
    this.app.use(cors({
      origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use(limiter as any);

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      const healthCheck: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.config.version,
        service: this.config.name,
        dependencies: {
          veeqo: 'healthy',
          redis: this.config.redisUrl ? 'healthy' : 'unhealthy',
          webhooks: this.config.enableWebhooks ? 'healthy' : 'unhealthy'
        } as Record<string, 'healthy' | 'unhealthy'>
      };

      res.json(healthCheck);
    });

    // Metrics endpoint
    this.app.get('/metrics', (_req: Request, res: Response) => {
      const metrics = {
        uptime: Date.now() - this.startTime.getTime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: this.config.version,
        tools: this.getAvailableTools(),
        resources: this.getAvailableResources(),
        veeqoStats: this.veeqoClient.getStats(),
        webhookStats: this.webhookManager?.getStats()
      };

      res.json(metrics);
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    this.httpServer = createServer(this.app);
  }

  /**
   * Setup webhook server for receiving Veeqo webhooks
   */
  private setupWebhookServer(): void {
    if (!this.webhookHandlers) return;

    this.webhookApp = express();

    // Security middleware for webhooks
    this.webhookApp.use(helmet());
    this.webhookApp.use(express.raw({ type: 'application/json', limit: '1mb' }));

    // Webhook endpoint
    this.webhookApp.post('/webhook', async (req: Request, res: Response) => {
      try {
        const signature = req.headers['x-veeqo-signature'] as string;
        const payload = req.body;

        if (!this.webhookHandlers) {
          throw new Error('Webhook handlers not initialized');
        }

        await this.webhookHandlers.handleWebhook(payload, signature);
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Webhook processing failed', {
          error: error instanceof Error ? error.message : String(error),
          headers: req.headers
        });
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    });

    // Health check for webhook server
    this.webhookApp.get('/webhook/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhookManager: this.webhookManager?.getStats()
      });
    });

    this.webhookServer = createServer(this.webhookApp);
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Server is already running');
      return;
    }

    try {
      // Test Veeqo connection
      await this.handlers.getCurrentUser();
      logger.info('Veeqo API connection verified');

      // Start webhook manager if enabled
      if (this.webhookManager) {
        await this.webhookManager.start();
        logger.info('Webhook manager started');
      }

      // Start HTTP server if configured
      if (this.httpServer && this.config.port) {
        await new Promise<void>((resolve, reject) => {
          this.httpServer!.listen(this.config.port, (error?: Error) => {
            if (error) {
              reject(error);
            } else {
              logger.info('HTTP server started', { port: this.config.port });
              resolve();
            }
          });
        });
      }

      // Start webhook server if configured
      if (this.webhookServer && this.config.webhookPort) {
        await new Promise<void>((resolve, reject) => {
          this.webhookServer!.listen(this.config.webhookPort, (error?: Error) => {
            if (error) {
              reject(error);
            } else {
              logger.info('Webhook server started', { port: this.config.webhookPort });
              resolve();
            }
          });
        });
      }

      // Connect MCP server to stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.isRunning = true;
      logger.info('MCP Server connected and ready');

    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Close webhook server
      if (this.webhookServer) {
        await new Promise<void>((resolve) => {
          this.webhookServer!.close(() => {
            logger.info('Webhook server closed');
            resolve();
          });
        });
      }

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
      }

      // Stop webhook manager
      if (this.webhookManager) {
        await this.webhookManager.stop();
        logger.info('Webhook manager stopped');
      }

      // Close MCP server
      await this.server.close();
      
      this.isRunning = false;
      logger.info('MCP Server stopped');

    } catch (error) {
      logger.error('Error stopping server', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Tool handler implementations
   */

  private async handleCreateOrder(args: unknown) {
    const validation = validateOrderCreation(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid order creation parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.createOrder(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Order created successfully with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetOrders(args: unknown) {
    const validation = validateOrderSearch(args || {});
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid order search parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.getOrders(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} orders`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetOrder(args: unknown) {
    const orderId = (args as any)?.orderId || (args as any)?.id;
    if (!orderId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Order ID is required'
      );
    }

    const result = await this.handlers.getOrder(orderId);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Order ${orderId} details`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateOrder(args: unknown) {
    const orderId = (args as any)?.orderId || (args as any)?.id;
    const updates = (args as any)?.updates;
    
    if (!orderId || !updates) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Order ID and updates are required'
      );
    }

    const result = await this.handlers.updateOrder(orderId, updates);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Order ${orderId} updated successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateProduct(args: unknown) {
    const validation = validateProductCreation(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid product creation parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.createProduct(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Product created successfully with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetProducts(args: unknown) {
    const validation = validateProductSearch(args || {});
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid product search parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.getProducts(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} products`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetProduct(args: unknown) {
    const productId = (args as any)?.productId || (args as any)?.id;
    if (!productId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Product ID is required'
      );
    }

    const result = await this.handlers.getProduct(productId);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Product ${productId} details`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateProduct(args: unknown) {
    const validation = validateProductUpdate(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid product update parameters',
        validation.error.errors
      );
    }

    const { productId, ...updates } = validation.data;
    const result = await this.handlers.updateProduct(productId, updates);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Product ${productId} updated successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetInventory(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getInventory(filters);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Retrieved inventory data`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateInventory(args: unknown) {
    const validation = validateInventoryUpdate(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid inventory update parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.updateInventory(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Inventory updated successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetStockEntries(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getStockEntries(filters);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Retrieved stock entries`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateCustomer(args: unknown) {
    const validation = validateCustomerCreation(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid customer creation parameters',
        validation.error.errors
      );
    }

    const result = await this.handlers.createCustomer(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Customer created successfully with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetCustomers(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getCustomers(filters);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} customers`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetCustomer(args: unknown) {
    const customerId = (args as any)?.customerId || (args as any)?.id;
    if (!customerId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Customer ID is required'
      );
    }

    const result = await this.handlers.getCustomer(customerId);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Customer ${customerId} details`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetWarehouses(_args: unknown) {
    const result = await this.handlers.getWarehouses();
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} warehouses`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetWarehouse(args: unknown) {
    const warehouseId = (args as any)?.warehouseId || (args as any)?.id;
    if (!warehouseId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Warehouse ID is required'
      );
    }

    const result = await this.handlers.getWarehouse(warehouseId);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Warehouse ${warehouseId} details`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetShipments(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getShipments(filters);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} shipments`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateShipment(args: unknown) {
    const data = args as any;
    if (!data) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Shipment data is required'
      );
    }

    const result = await this.handlers.createShipment(data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Shipment created successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetAllocations(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getAllocations(filters);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} allocations`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Analytics and Reporting Handlers
  private async handleGetSalesAnalytics(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getSalesAnalytics(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'Sales analytics retrieved successfully'
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetInventoryReport(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getInventoryReport(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'Inventory report generated successfully'
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetOrderAnalytics(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getOrderAnalytics(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'Order analytics retrieved successfully'
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetProductPerformance(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getProductPerformance(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'Product performance data retrieved successfully'
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Bulk Operations Handlers
  private async handleBulkUpdateInventory(args: unknown) {
    const { updates } = args as { updates: any[] };
    const result = await this.handlers.bulkUpdateInventory(updates);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Bulk inventory update completed: ${result.success_count} successful, ${result.error_count} failed`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBulkCreateProducts(args: unknown) {
    const { products } = args as { products: any[] };
    const result = await this.handlers.bulkCreateProducts(products);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Bulk product creation completed: ${result.success_count} successful, ${result.error_count} failed`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBulkUpdatePrices(args: unknown) {
    const { price_updates } = args as { price_updates: any[] };
    const result = await this.handlers.bulkUpdatePrices(price_updates);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Bulk price update completed: ${result.success_count} successful, ${result.error_count} failed`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleExportOrders(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.exportOrders(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Order export completed: ${result.total_records} records exported`
        },
        {
          type: 'text' as const,
          text: `Export URL: ${result.download_url}`
        }
      ]
    };
  }

  private async handleExportProducts(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.exportProducts(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Product export completed: ${result.total_records} records exported`
        },
        {
          type: 'text' as const,
          text: `Export URL: ${result.download_url}`
        }
      ]
    };
  }

  // Advanced Management Handlers
  private async handleCreatePurchaseOrder(args: unknown) {
    const orderData = args as any;
    const result = await this.handlers.createPurchaseOrder(orderData);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Purchase order created with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetPurchaseOrders(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getPurchaseOrders(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} purchase orders`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleManageSuppliers(args: unknown) {
    const { action, supplier_data } = args as { action: string; supplier_data: any };
    const result = await this.handlers.manageSuppliers(action, supplier_data);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Supplier ${action} completed successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetSupplierProducts(args: unknown) {
    const { supplier_id } = args as { supplier_id: string };
    const result = await this.handlers.getSupplierProducts(supplier_id);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} products for supplier ${supplier_id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateReturn(args: unknown) {
    const returnData = args as any;
    const result = await this.handlers.createReturn(returnData);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Return created with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleProcessRefund(args: unknown) {
    const refundData = args as any;
    const result = await this.handlers.processRefund(refundData);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Refund processed: $${result.amount}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Integration and Sync Handlers
  private async handleSyncChannels(args: unknown) {
    const { channels } = args as { channels: string[] };
    const result = await this.handlers.syncChannels(channels);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Channel sync completed: ${result.synced_channels.length} channels synced`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetChannelListings(args: unknown) {
    const filters = args as any || {};
    const result = await this.handlers.getChannelListings(filters);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} channel listings`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleUpdateChannelInventory(args: unknown) {
    const { channel, inventory_updates } = args as { channel: string; inventory_updates: any[] };
    const result = await this.handlers.updateChannelInventory(channel, inventory_updates);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Channel inventory updated for ${channel}: ${result.updated_count} items updated`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Get tool definitions for MCP
   */
  private getToolDefinitions(): ToolDefinition[] {
    return [
      // Order Management Tools
      {
        name: 'create_order',
        description: 'Create a new order in Veeqo',
        inputSchema: {
          type: 'object',
          properties: {
            deliver_to: {
              type: 'object',
              description: 'Delivery address'
            },
            customer: {
              type: 'object', 
              description: 'Customer information'
            },
            line_items: {
              type: 'array',
              description: 'Order items'
            }
          },
          required: ['deliver_to', 'customer', 'line_items']
        }
      },
      {
        name: 'get_orders',
        description: 'Get list of orders with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            since_id: { type: 'number', description: 'Filter orders after this ID' },
            page: { type: 'number', description: 'Page number' },
            page_size: { type: 'number', description: 'Items per page (max 100)' },
            status: { type: 'string', description: 'Filter by order status' },
            created_at_min: { type: 'string', description: 'Created after date' },
            updated_at_min: { type: 'string', description: 'Updated after date' }
          }
        }
      },
      {
        name: 'get_order',
        description: 'Get detailed order information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'number', description: 'Order ID' }
          },
          required: ['orderId']
        }
      },
      {
        name: 'update_order',
        description: 'Update an existing order',
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'number', description: 'Order ID' },
            updates: { type: 'object', description: 'Fields to update' }
          },
          required: ['orderId', 'updates']
        }
      },
      // Product Management Tools
      {
        name: 'create_product',
        description: 'Create a new product in Veeqo',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Product title' },
            description: { type: 'string', description: 'Product description' },
            sellables: {
              type: 'array',
              description: 'Product variants/sellables'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'get_products',
        description: 'Get list of products with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            since_id: { type: 'number', description: 'Filter products after this ID' },
            page: { type: 'number', description: 'Page number' },
            page_size: { type: 'number', description: 'Items per page (max 100)' },
            query: { type: 'string', description: 'Search query' },
            created_at_min: { type: 'string', description: 'Created after date' }
          }
        }
      },
      {
        name: 'get_product',
        description: 'Get detailed product information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'number', description: 'Product ID' }
          },
          required: ['productId']
        }
      },
      {
        name: 'update_product',
        description: 'Update an existing product',
        inputSchema: {
          type: 'object',
          properties: {
            productId: { type: 'number', description: 'Product ID' },
            title: { type: 'string', description: 'Product title' },
            description: { type: 'string', description: 'Product description' }
          },
          required: ['productId']
        }
      },
      // Inventory Management Tools
      {
        name: 'get_inventory',
        description: 'Get inventory levels across warehouses',
        inputSchema: {
          type: 'object',
          properties: {
            warehouse_id: { type: 'number', description: 'Filter by warehouse ID' },
            product_id: { type: 'number', description: 'Filter by product ID' },
            sellable_id: { type: 'number', description: 'Filter by sellable ID' }
          }
        }
      },
      {
        name: 'update_inventory',
        description: 'Update inventory levels',
        inputSchema: {
          type: 'object',
          properties: {
            sellable_id: { type: 'number', description: 'Sellable ID' },
            warehouse_id: { type: 'number', description: 'Warehouse ID' },
            physical_stock_level: { type: 'number', description: 'New stock level' }
          },
          required: ['sellable_id', 'warehouse_id', 'physical_stock_level']
        }
      },
      {
        name: 'get_stock_entries',
        description: 'Get detailed stock entries',
        inputSchema: {
          type: 'object',
          properties: {
            warehouse_id: { type: 'number', description: 'Filter by warehouse ID' }
          }
        }
      },
      // Customer Management Tools
      {
        name: 'create_customer',
        description: 'Create a new customer',
        inputSchema: {
          type: 'object',
          properties: {
            first_name: { type: 'string', description: 'First name' },
            last_name: { type: 'string', description: 'Last name' },
            email: { type: 'string', description: 'Email address' },
            phone_number: { type: 'string', description: 'Phone number' }
          },
          required: ['first_name', 'last_name', 'email']
        }
      },
      {
        name: 'get_customers',
        description: 'Get list of customers',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            page_size: { type: 'number', description: 'Items per page (max 100)' },
            query: { type: 'string', description: 'Search query' }
          }
        }
      },
      {
        name: 'get_customer',
        description: 'Get customer details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: { type: 'number', description: 'Customer ID' }
          },
          required: ['customerId']
        }
      },
      // Warehouse Management Tools
      {
        name: 'get_warehouses',
        description: 'Get list of warehouses/locations',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_warehouse',
        description: 'Get warehouse details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            warehouseId: { type: 'number', description: 'Warehouse ID' }
          },
          required: ['warehouseId']
        }
      },
      // Shipment Tools
      {
        name: 'get_shipments',
        description: 'Get list of shipments',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'number', description: 'Filter by order ID' },
            page: { type: 'number', description: 'Page number' },
            page_size: { type: 'number', description: 'Items per page' }
          }
        }
      },
      {
        name: 'create_shipment',
        description: 'Create a new shipment',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'number', description: 'Order ID' },
            carrier: { type: 'string', description: 'Shipping carrier' },
            service: { type: 'string', description: 'Shipping service' }
          },
          required: ['order_id']
        }
      },
      {
        name: 'get_allocations',
        description: 'Get inventory allocations',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'number', description: 'Filter by order ID' },
            warehouse_id: { type: 'number', description: 'Filter by warehouse ID' }
          }
        }
      },

      // Analytics and Reporting Tools
      {
        name: 'get_sales_analytics',
        description: 'Get detailed sales analytics and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            date_from: { type: 'string', description: 'Start date for analytics' },
            date_to: { type: 'string', description: 'End date for analytics' },
            channel_id: { type: 'number', description: 'Filter by sales channel' }
          }
        }
      },
      {
        name: 'get_inventory_report',
        description: 'Generate comprehensive inventory reports',
        inputSchema: {
          type: 'object',
          properties: {
            warehouse_id: { type: 'number', description: 'Filter by warehouse' },
            low_stock_threshold: { type: 'number', description: 'Low stock alert threshold' },
            include_variants: { type: 'boolean', description: 'Include product variants' }
          }
        }
      },
      {
        name: 'get_order_analytics',
        description: 'Analyze order patterns and trends',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'Time period (day, week, month, year)' },
            date_from: { type: 'string', description: 'Start date' },
            date_to: { type: 'string', description: 'End date' }
          }
        }
      },
      {
        name: 'get_product_performance',
        description: 'Get product performance metrics and insights',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: { type: 'number', description: 'Specific product ID' },
            metric_type: { type: 'string', description: 'Type of performance metric' },
            period: { type: 'string', description: 'Analysis period' }
          }
        }
      },

      // Bulk Operations Tools
      {
        name: 'bulk_update_inventory',
        description: 'Update inventory levels for multiple products at once',
        inputSchema: {
          type: 'object',
          properties: {
            updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sellable_id: { type: 'number' },
                  warehouse_id: { type: 'number' },
                  physical_stock_level: { type: 'number' }
                }
              },
              description: 'Array of inventory updates'
            }
          },
          required: ['updates']
        }
      },
      {
        name: 'bulk_create_products',
        description: 'Create multiple products in a single operation',
        inputSchema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: { type: 'object' },
              description: 'Array of product data to create'
            }
          },
          required: ['products']
        }
      },
      {
        name: 'bulk_update_prices',
        description: 'Update prices for multiple products',
        inputSchema: {
          type: 'object',
          properties: {
            price_updates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'number' },
                  price: { type: 'string' }
                }
              },
              description: 'Array of price updates'
            }
          },
          required: ['price_updates']
        }
      },
      {
        name: 'export_orders',
        description: 'Export orders to CSV or other formats',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', description: 'Export format (csv, json, xlsx)' },
            date_from: { type: 'string', description: 'Start date' },
            date_to: { type: 'string', description: 'End date' },
            status: { type: 'string', description: 'Order status filter' }
          }
        }
      },
      {
        name: 'export_products',
        description: 'Export product catalog to various formats',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', description: 'Export format (csv, json, xlsx)' },
            include_inventory: { type: 'boolean', description: 'Include inventory data' },
            category_filter: { type: 'string', description: 'Filter by category' }
          }
        }
      },

      // Advanced Management Tools
      {
        name: 'create_purchase_order',
        description: 'Create purchase orders for inventory replenishment',
        inputSchema: {
          type: 'object',
          properties: {
            supplier_id: { type: 'number', description: 'Supplier ID' },
            warehouse_id: { type: 'number', description: 'Destination warehouse' },
            line_items: {
              type: 'array',
              items: { type: 'object' },
              description: 'Items to order'
            }
          },
          required: ['supplier_id', 'warehouse_id', 'line_items']
        }
      },
      {
        name: 'get_purchase_orders',
        description: 'Retrieve purchase order history and status',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status' },
            supplier_id: { type: 'number', description: 'Filter by supplier' },
            date_from: { type: 'string', description: 'Start date' }
          }
        }
      },
      {
        name: 'manage_suppliers',
        description: 'Add, update, or manage supplier information',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action to perform (create, update, delete)' },
            supplier_data: { type: 'object', description: 'Supplier information' }
          },
          required: ['action', 'supplier_data']
        }
      },
      {
        name: 'get_supplier_products',
        description: 'Get products associated with a supplier',
        inputSchema: {
          type: 'object',
          properties: {
            supplier_id: { type: 'string', description: 'Supplier ID' }
          },
          required: ['supplier_id']
        }
      },
      {
        name: 'create_return',
        description: 'Create return/RMA for products',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'number', description: 'Original order ID' },
            return_items: {
              type: 'array',
              items: { type: 'object' },
              description: 'Items being returned'
            },
            reason: { type: 'string', description: 'Return reason' }
          },
          required: ['order_id', 'return_items']
        }
      },
      {
        name: 'process_refund',
        description: 'Process customer refunds',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'number', description: 'Order ID' },
            amount: { type: 'string', description: 'Refund amount' },
            reason: { type: 'string', description: 'Refund reason' }
          },
          required: ['order_id', 'amount']
        }
      },

      // Integration and Sync Tools
      {
        name: 'sync_channels',
        description: 'Synchronize inventory and orders with sales channels',
        inputSchema: {
          type: 'object',
          properties: {
            channels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Channels to sync'
            }
          },
          required: ['channels']
        }
      },
      {
        name: 'get_channel_listings',
        description: 'Get product listings across different sales channels',
        inputSchema: {
          type: 'object',
          properties: {
            channel_id: { type: 'number', description: 'Filter by channel' },
            status: { type: 'string', description: 'Listing status' }
          }
        }
      },
      {
        name: 'update_channel_inventory',
        description: 'Update inventory levels on specific sales channels',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel name' },
            inventory_updates: {
              type: 'array',
              items: { type: 'object' },
              description: 'Inventory updates for channel'
            }
          },
          required: ['channel', 'inventory_updates']
        }
      }
    ];
  }

  /**
   * Get resource definitions for MCP
   */
  private getResourceDefinitions(): ResourceDefinition[] {
    return [
      {
        uri: 'veeqo://account',
        name: 'Veeqo Account',
        description: 'Current Veeqo account information and settings',
        mimeType: 'application/json'
      },
      {
        uri: 'veeqo://stores',
        name: 'Veeqo Stores',
        description: 'List of connected stores and sales channels',
        mimeType: 'application/json'
      },
      {
        uri: 'veeqo://warehouses',
        name: 'Veeqo Warehouses',
        description: 'List of warehouses and fulfillment locations',
        mimeType: 'application/json'
      },
      {
        uri: 'veeqo://channels',
        name: 'Sales Channels',
        description: 'List of configured sales channels and integrations',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Get available tools list
   */
  getAvailableTools(): string[] {
    return this.getToolDefinitions().map(tool => tool.name);
  }

  /**
   * Get available resources list
   */
  getAvailableResources(): string[] {
    return this.getResourceDefinitions().map(resource => resource.uri);
  }

  /**
   * Get server status
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server configuration
   */
  getConfig(): VeeqoMCPServerConfig {
    return { ...this.config };
  }
}
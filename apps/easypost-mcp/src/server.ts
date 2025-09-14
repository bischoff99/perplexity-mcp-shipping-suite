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
import { createServer, Server as HttpServer } from 'http';

import { logger } from './utils/logger.js';
import { EasyPostClient } from './services/easypost-client.js';
import { EasyPostHandlers } from './handlers/easypost.js';
import {
  EasyPostMCPServerConfig,
  ToolDefinition,
  ResourceDefinition,
  EasyPostError,
  HealthCheckResponse
} from './types/index.js';
import {
  validateShipmentCreation,
  validateShipmentRatesFetch,
  validateShipmentLabelPurchase,
  validateShipmentTracking,
  validateAddressVerification
} from './utils/validation.js';

/**
 * Production-ready EasyPost MCP Server
 * Implements Model Context Protocol for EasyPost API integration
 */
export class EasyPostMCPServer {
  private server: Server;
  private httpServer?: HttpServer;
  private app?: Express;
  private config: EasyPostMCPServerConfig;
  private easyPostClient: EasyPostClient;
  private handlers: EasyPostHandlers;
  private isRunning = false;
  private startTime: Date;

  constructor(config: EasyPostMCPServerConfig) {
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

    // Initialize EasyPost client
    this.easyPostClient = new EasyPostClient({
      apiKey: config.apiKey,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      enableCache: config.enableCache,
      baseURL: config.environment === 'production' 
        ? 'https://api.easypost.com/v2'
        : 'https://api.easypost.com/v2' // EasyPost uses same URL for both
    });

    // Initialize handlers
    this.handlers = new EasyPostHandlers(this.easyPostClient);

    // Setup MCP handlers
    this.setupMCPHandlers();

    // Setup HTTP server for health checks if port is provided
    if (config.port) {
      this.setupHttpServer();
    }

    logger.info('EasyPost MCP Server initialized', {
      name: config.name,
      version: config.version,
      environment: config.environment,
      port: config.port,
      enableCache: config.enableCache
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
          requestId: (request as any).id ?? 'unknown'
        });

        switch (name) {
          case 'create_shipment':
            return await this.handleCreateShipment(args);
          
          case 'get_shipment_rates':
            return await this.handleGetShipmentRates(args);
          
          case 'buy_shipment_label':
            return await this.handleBuyShipmentLabel(args);
          
          case 'track_shipment':
            return await this.handleTrackShipment(args);
          
          case 'validate_address':
            return await this.handleValidateAddress(args);
          
          case 'get_smartrate_estimates':
            return await this.handleGetSmartrateEstimates(args);

          case 'refund_shipment':
            return await this.handleRefundShipment(args);

          case 'buy_insurance':
            return await this.handleBuyInsurance(args);

          case 'create_batch':
            return await this.handleCreateBatch();

          case 'add_shipments_to_batch':
            return await this.handleAddShipmentsToBatch(args);

          case 'buy_batch':
            return await this.handleBuyBatch(args);

          case 'scan_form_create':
            return await this.handleCreateScanForm(args);

          case 'get_customs_info':
            return await this.handleGetCustomsInfo(args);

          case 'create_customs_info':
            return await this.handleCreateCustomsInfo(args);

          case 'verify_address':
            return await this.handleVerifyAddress(args);

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
          requestId: (request as any).id ?? 'unknown'
        });

        if (error instanceof McpError) {
          throw error;
        }

        if (error instanceof EasyPostError) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `EasyPost API error: ${error.message}`,
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
          requestId: (request as any).id ?? 'unknown'
        });

        if (uri === 'easypost://account') {
          const account = await this.handlers.getAccount();
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

        if (uri === 'easypost://carriers') {
          const carriers = await this.handlers.getCarriers();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(carriers, null, 2)
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
          requestId: (request as any).id ?? 'unknown'
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
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '1mb' }));

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      const healthCheck: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.config.version,
        service: this.config.name,
        dependencies: {
          easypost: 'healthy' // Could implement actual EasyPost API health check
        }
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
        resources: this.getAvailableResources()
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
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Server is already running');
      return;
    }

    try {
      // Test EasyPost connection (optional during startup)
      try {
        await this.handlers.getAccount();
        logger.info('EasyPost API connection verified');
      } catch (accountError) {
        logger.warn('Account verification failed during startup, but continuing', {
          error: accountError instanceof Error ? accountError.message : String(accountError)
        });
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
      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });
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
  
  private async handleCreateShipment(args: unknown) {
    const validation = validateShipmentCreation(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid shipment creation parameters',
        validation.error.issues
      );
    }

    const result = await this.handlers.createShipment(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Shipment created successfully with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetShipmentRates(args: unknown) {
    const validation = validateShipmentRatesFetch(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid shipment rates parameters',
        validation.error.issues
      );
    }

    const result = await this.handlers.getShipmentRates(validation.data.shipmentId);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${result.length} rates for shipment ${validation.data.shipmentId}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBuyShipmentLabel(args: unknown) {
    const validation = validateShipmentLabelPurchase(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid label purchase parameters',
        validation.error.issues
      );
    }

    const result = await this.handlers.buyShipmentLabel(
      validation.data.shipmentId,
      validation.data.rateId
    );
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Label purchased successfully for shipment ${validation.data.shipmentId}`
        },
        {
          type: 'text' as const,
          text: `Tracking Code: ${result.tracking_code || 'N/A'}`
        },
        {
          type: 'text' as const,
          text: `Label URL: ${result.postage_label?.label_url || 'N/A'}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleTrackShipment(args: unknown) {
    const validation = validateShipmentTracking(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid tracking parameters',
        validation.error.issues
      );
    }

    const result = await this.handlers.trackShipment(
      validation.data.trackingCode,
      validation.data.carrier
    );
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Tracking Status: ${result.status || 'Unknown'}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleValidateAddress(args: unknown) {
    const validation = validateAddressVerification(args);
    if (!validation.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid address validation parameters',
        validation.error.issues
      );
    }

    const result = await this.handlers.validateAddress(validation.data);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Address validation complete'
        },
        {
          type: 'text' as const,
          text: `Valid: ${result.verifications?.delivery?.success ? 'Yes' : 'No'}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetSmartrateEstimates(args: unknown) {
    // For now, pass through the args directly since we don't have validation imported
    // TODO: Add proper validation using validateSmartrateRequest
    const result = await this.handlers.getSmartrateEstimates(args as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'SmartRate estimates retrieved successfully'
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleRefundShipment(args: unknown) {
    const { shipmentId } = args as { shipmentId: string };
    const result = await this.handlers.refundShipment(shipmentId);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Refund initiated for shipment ${shipmentId}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBuyInsurance(args: unknown) {
    const { shipmentId, amount } = args as { shipmentId: string; amount: string };
    const result = await this.handlers.buyInsurance(shipmentId, amount);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Insurance purchased for shipment ${shipmentId}`
        },
        {
          type: 'text' as const,
          text: `Coverage Amount: $${amount}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateBatch() {
    const result = await this.handlers.createBatch();

    return {
      content: [
        {
          type: 'text' as const,
          text: `Batch created successfully with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleAddShipmentsToBatch(args: unknown) {
    const { batchId, shipmentIds } = args as { batchId: string; shipmentIds: string[] };
    const result = await this.handlers.addShipmentsToBatch(batchId, shipmentIds);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Added ${shipmentIds.length} shipments to batch ${batchId}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleBuyBatch(args: unknown) {
    const { batchId } = args as { batchId: string };
    const result = await this.handlers.buyBatch(batchId);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Batch ${batchId} purchased successfully`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateScanForm(args: unknown) {
    const { shipmentIds } = args as { shipmentIds: string[] };
    const result = await this.handlers.createScanForm(shipmentIds);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Scan form created for ${shipmentIds.length} shipments`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleGetCustomsInfo(args: unknown) {
    const { customsInfoId } = args as { customsInfoId: string };
    const result = await this.handlers.getCustomsInfo(customsInfoId);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Customs info retrieved for ID: ${customsInfoId}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleCreateCustomsInfo(args: unknown) {
    const result = await this.handlers.createCustomsInfo(args as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Customs info created with ID: ${result.id}`
        },
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleVerifyAddress(args: unknown) {
    const result = await this.handlers.verifyAddress(args as any);

    return {
      content: [
        {
          type: 'text' as const,
          text: 'Address verification complete'
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
      {
        name: 'create_shipment',
        description: 'Create a new shipment with EasyPost API',
        inputSchema: {
          type: 'object',
          properties: {
            to_address: {
              type: 'object',
              description: 'Destination address'
            },
            from_address: {
              type: 'object',
              description: 'Origin address'
            },
            parcel: {
              type: 'object',
              description: 'Package dimensions and weight'
            },
            options: {
              type: 'object',
              description: 'Additional shipping options'
            }
          },
          required: ['to_address', 'from_address', 'parcel']
        }
      },
      {
        name: 'get_shipment_rates',
        description: 'Get available shipping rates for a shipment',
        inputSchema: {
          type: 'object',
          properties: {
            shipmentId: {
              type: 'string',
              description: 'EasyPost shipment ID'
            }
          },
          required: ['shipmentId']
        }
      },
      {
        name: 'buy_shipment_label',
        description: 'Purchase shipping label for a shipment',
        inputSchema: {
          type: 'object',
          properties: {
            shipmentId: {
              type: 'string',
              description: 'EasyPost shipment ID'
            },
            rateId: {
              type: 'string',
              description: 'Selected rate ID'
            }
          },
          required: ['shipmentId', 'rateId']
        }
      },
      {
        name: 'track_shipment',
        description: 'Track a shipment by tracking code',
        inputSchema: {
          type: 'object',
          properties: {
            trackingCode: {
              type: 'string',
              description: 'Tracking code'
            },
            carrier: {
              type: 'string',
              description: 'Carrier name (optional)'
            }
          },
          required: ['trackingCode']
        }
      },
      {
        name: 'validate_address',
        description: 'Validate and normalize an address',
        inputSchema: {
          type: 'object',
          properties: {
            street1: {
              type: 'string',
              description: 'Street address line 1'
            },
            street2: {
              type: 'string',
              description: 'Street address line 2'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State or province'
            },
            zip: {
              type: 'string',
              description: 'Postal code'
            },
            country: {
              type: 'string',
              description: 'Country code'
            }
          },
          required: ['street1', 'city', 'state', 'zip', 'country']
        }
      },
      {
        name: 'get_smartrate_estimates',
        description: 'Get SmartRate time-in-transit estimates',
        inputSchema: {
          type: 'object',
          properties: {
            from_zip: {
              type: 'string',
              description: 'Origin ZIP code'
            },
            to_zip: {
              type: 'string',
              description: 'Destination ZIP code'
            },
            carriers: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of carrier names'
            }
          },
          required: ['from_zip', 'to_zip']
        }
      },
      {
        name: 'refund_shipment',
        description: 'Request a refund for a shipped package',
        inputSchema: {
          type: 'object',
          properties: {
            shipmentId: {
              type: 'string',
              description: 'EasyPost shipment ID to refund'
            }
          },
          required: ['shipmentId']
        }
      },
      {
        name: 'buy_insurance',
        description: 'Purchase insurance for a shipment',
        inputSchema: {
          type: 'object',
          properties: {
            shipmentId: {
              type: 'string',
              description: 'EasyPost shipment ID'
            },
            amount: {
              type: 'string',
              description: 'Insurance coverage amount'
            }
          },
          required: ['shipmentId', 'amount']
        }
      },
      {
        name: 'create_batch',
        description: 'Create a batch for bulk shipment processing',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'add_shipments_to_batch',
        description: 'Add multiple shipments to a batch',
        inputSchema: {
          type: 'object',
          properties: {
            batchId: {
              type: 'string',
              description: 'Batch ID to add shipments to'
            },
            shipmentIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of shipment IDs to add'
            }
          },
          required: ['batchId', 'shipmentIds']
        }
      },
      {
        name: 'buy_batch',
        description: 'Purchase all shipments in a batch',
        inputSchema: {
          type: 'object',
          properties: {
            batchId: {
              type: 'string',
              description: 'Batch ID to purchase'
            }
          },
          required: ['batchId']
        }
      },
      {
        name: 'scan_form_create',
        description: 'Create a SCAN form for shipments',
        inputSchema: {
          type: 'object',
          properties: {
            shipmentIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of shipment IDs for the SCAN form'
            }
          },
          required: ['shipmentIds']
        }
      },
      {
        name: 'get_customs_info',
        description: 'Retrieve customs information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customsInfoId: {
              type: 'string',
              description: 'Customs info ID'
            }
          },
          required: ['customsInfoId']
        }
      },
      {
        name: 'create_customs_info',
        description: 'Create customs information for international shipments',
        inputSchema: {
          type: 'object',
          properties: {
            customs_items: {
              type: 'array',
              description: 'Array of customs items'
            },
            contents_type: {
              type: 'string',
              description: 'Type of contents (merchandise, documents, etc.)'
            },
            contents_explanation: {
              type: 'string',
              description: 'Explanation of contents'
            },
            customs_certify: {
              type: 'boolean',
              description: 'Customs certification'
            },
            customs_signer: {
              type: 'string',
              description: 'Name of customs signer'
            }
          },
          required: ['customs_items', 'contents_type', 'customs_certify', 'customs_signer']
        }
      },
      {
        name: 'verify_address',
        description: 'Advanced address verification with carrier validation',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'object',
              description: 'Address to verify'
            },
            carrier: {
              type: 'string',
              description: 'Specific carrier to verify against'
            }
          },
          required: ['address']
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
        uri: 'easypost://account',
        name: 'EasyPost Account',
        description: 'Current EasyPost account information and settings',
        mimeType: 'application/json'
      },
      {
        uri: 'easypost://carriers',
        name: 'Available Carriers',
        description: 'List of available shipping carriers and their capabilities',
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
  getConfig(): EasyPostMCPServerConfig {
    return { ...this.config };
  }
}
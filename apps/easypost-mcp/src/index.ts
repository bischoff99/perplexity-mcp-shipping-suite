#!/usr/bin/env node

import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { EasyPostMCPServer } from './server.js';
import { validateEnvironmentVariables } from './utils/validation.js';

// Load environment variables first
config();

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
    pid: process.pid
  });
  process.exit(1);
});

// Graceful shutdown handler
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`, {
    pid: process.pid,
    signal
  });

  // Close server connections, cleanup resources
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    // Validate required environment variables
    const envValidation = validateEnvironmentVariables();
    if (!envValidation.success) {
      logger.error('Environment validation failed:', {
        errors: envValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
      process.exit(1);
    }

    logger.info('Starting EasyPost MCP Server', {
      version: process.env['npm_package_version'] || '1.0.0',
      nodeVersion: process.version,
      environment: process.env['NODE_ENV'] || 'development',
      pid: process.pid
    });

    // Initialize and start MCP server
    const server = new EasyPostMCPServer({
      name: 'easypost-mcp-server',
      version: process.env['npm_package_version'] || '1.0.0',
      apiKey: envValidation.data.EASYPOST_API_KEY,
      environment: envValidation.data.NODE_ENV,
      timeout: envValidation.data.EASYPOST_TIMEOUT,
      retryAttempts: envValidation.data.EASYPOST_RETRY_ATTEMPTS,
      enableCache: envValidation.data.ENABLE_CACHE,
      logLevel: envValidation.data.LOG_LEVEL,
      port: envValidation.data.PORT ?? undefined
    });

    // Start the server
    await server.start();

    logger.info('EasyPost MCP Server started successfully', {
      pid: process.pid,
      port: envValidation.data.PORT,
      tools: server.getAvailableTools(),
      resources: server.getAvailableResources()
    });

  } catch (error) {
    logger.error('Failed to start EasyPost MCP Server:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pid: process.pid
    });
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Fatal error in main:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pid: process.pid
    });
    process.exit(1);
  });
}

export { main };
import winston, { Logger, format, transports } from 'winston';
import { CONSTANTS, type LoggerContext } from '../types/index.js';

/**
 * Production-ready Winston logger configuration for Veeqo MCP Server
 * Provides structured logging with performance tracking and security-aware log formatting
 */

// Custom log levels for Veeqo operations
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    performance: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
    performance: 'magenta'
  }
};

// Add colors to winston
winston.addColors(customLevels.colors);

/**
 * Custom format for structured logging
 */
const structuredFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.json(),
  format.printf((info) => {
    const {
      timestamp,
      level,
      message,
      stack,
      pid = process.pid,
      service = 'veeqo-mcp-server',
      version = process.env['npm_package_version'] || '1.0.0',
      environment = process.env['NODE_ENV'] || 'development',
      ...metadata
    } = info;

    // Base log structure
    const logEntry = {
      timestamp,
      level,
      message,
      pid,
      service,
      version,
      environment,
      ...sanitizeLogMetadata(metadata)
    };

    // Add stack trace for errors
    if (stack) {
      (logEntry as any).stack = stack;
    }

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.colorize({ all: true }),
  format.printf((info) => {
    const { timestamp, level, message, stack, ...metadata } = info;
    
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    // Add metadata if present
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      const cleanMetadata = sanitizeLogMetadata(metadata);
      logMessage += ` ${JSON.stringify(cleanMetadata)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

/**
 * Create Winston logger instance
 */
function createLogger(): Logger {
  const logLevel = process.env['LOG_LEVEL'] || 'info';
  const environment = process.env['NODE_ENV'] || 'development';
  const logDir = process.env['LOG_DIR'] || './logs';

  const loggerTransports: winston.transport[] = [];

  // Console transport (always enabled for development)
  if (environment === 'development') {
    loggerTransports.push(
      new transports.Console({
        level: logLevel,
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  } else {
    // Production console transport with structured format
    loggerTransports.push(
      new transports.Console({
        level: logLevel,
        format: structuredFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  // File transports for production
  if (environment === 'production') {
    // Combined log file (all levels)
    loggerTransports.push(
      new transports.File({
        filename: `${logDir}/combined.log`,
        level: 'debug',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Error-only log file
    loggerTransports.push(
      new transports.File({
        filename: `${logDir}/error.log`,
        level: 'error',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      })
    );

    // HTTP access log file
    loggerTransports.push(
      new transports.File({
        filename: `${logDir}/access.log`,
        level: 'http',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      })
    );

    // Performance log file
    loggerTransports.push(
      new transports.File({
        filename: `${logDir}/performance.log`,
        level: 'performance',
        format: format.combine(
          format.timestamp(),
          format.json(),
          format.printf((info) => {
            if (info.level === 'performance') {
              return JSON.stringify({
                timestamp: info['timestamp'],
                operation: info['operation'] || 'unknown',
                duration: info['duration'] || 0,
                ...sanitizeLogMetadata(info)
              });
            }
            return '';
          })
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3,
        tailable: true
      })
    );
  }

  return winston.createLogger({
    levels: customLevels.levels,
    level: logLevel,
    format: structuredFormat,
    transports: loggerTransports,
    exitOnError: false, // Don't exit on handled exceptions
    
    // Exception handlers
    exceptionHandlers: environment === 'production' ? [
      new transports.File({
        filename: `${logDir}/exceptions.log`,
        format: structuredFormat
      })
    ] : [],

    // Rejection handlers  
    rejectionHandlers: environment === 'production' ? [
      new transports.File({
        filename: `${logDir}/rejections.log`,
        format: structuredFormat
      })
    ] : []
  });
}

/**
 * Sanitize log metadata to remove sensitive information
 */
function sanitizeLogMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...metadata };
  
  // List of sensitive field names to redact
  const sensitiveFields = [
    'password',
    'passwd',
    'secret',
    'token',
    'key',
    'apikey',
    'api_key',
    'authorization',
    'auth',
    'webhook_secret',
    'private_key',
    'access_token',
    'refresh_token',
    'session_id',
    'cookie',
    'cookies'
  ];

  // Recursively sanitize nested objects
  function sanitizeValue(value: unknown, key: string): unknown {
    if (typeof value === 'string') {
      // Check if key is sensitive
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        return '[REDACTED]';
      }
      
      // Mask email addresses
      if (key.toLowerCase().includes('email') && value.includes('@')) {
        return maskEmail(value);
      }
      
      // Mask phone numbers
      if (key.toLowerCase().includes('phone') && value.length > 7) {
        return maskPhoneNumber(value);
      }
      
      return value;
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedSanitized: Record<string, unknown> = {};
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        nestedSanitized[nestedKey] = sanitizeValue(nestedValue, nestedKey);
      }
      return nestedSanitized;
    }
    
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitizeValue(item, `${key}_${index}`));
    }
    
    return value;
  }

  // Sanitize all top-level fields
  for (const [key, value] of Object.entries(sanitized)) {
    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized;
}

/**
 * Mask email address for logging
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || !localPart) return email;

  const maskedLocal = localPart.length > 2
    ? localPart.substring(0, 2) + '*'.repeat(Math.max(0, localPart.length - 2))
    : localPart;
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone;
  
  const start = Math.min(3, phone.length - 3);
  const end = Math.max(start, phone.length - 3);
  
  return phone.substring(0, start) + 
         '*'.repeat(Math.max(0, end - start)) + 
         phone.substring(end);
}

/**
 * Create the main logger instance
 */
const logger = createLogger();

/**
 * Enhanced logger with custom methods for Veeqo operations
 */
interface VeeqoLogger extends Logger {
  performance(_operation: string, _duration: number, _context?: LoggerContext): void;
  veeqoApi(_method: string, _url: string, _status: number, _duration: number, _context?: LoggerContext): void;
  orderEvent(_event: string, _orderId: number, _context?: LoggerContext): void;
  productEvent(_event: string, _productId: number, _context?: LoggerContext): void;
  inventoryEvent(_event: string, _sellableId: number, _warehouseId: number, _context?: LoggerContext): void;
  webhookEvent(_event: string, _resourceType: string, _resourceId: number, _context?: LoggerContext): void;
  security(_event: string, _details: Record<string, unknown>): void;
}

/**
 * Create enhanced logger with custom methods
 */
const enhancedLogger: VeeqoLogger = Object.assign(logger, {
  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context: LoggerContext = {}) {
    const performanceData = {
      operation,
      duration,
      performance: true,
      ...context
    };

    // Log as warning if duration exceeds target
    if (duration > CONSTANTS.RESPONSE_TIMEOUT_MS) {
      logger.warn(`Slow operation detected: ${operation}`, performanceData);
    } else {
      logger.log('performance', `Performance: ${operation} completed in ${duration}ms`, performanceData);
    }
  },

  /**
   * Log Veeqo API requests
   */
  veeqoApi(method: string, url: string, status: number, duration: number, context: LoggerContext = {}) {
    const apiData = {
      method,
      url,
      status,
      duration,
      api: 'veeqo',
      ...context
    };

    if (status >= 400) {
      logger.error(`Veeqo API error: ${method} ${url}`, apiData);
    } else if (status >= 300) {
      logger.warn(`Veeqo API redirect: ${method} ${url}`, apiData);
    } else {
      logger.http(`Veeqo API: ${method} ${url}`, apiData);
    }
  },

  /**
   * Log order-related events
   */
  orderEvent(event: string, orderId: number, context: LoggerContext = {}) {
    logger.info(`Order ${event}`, {
      event,
      orderId,
      resourceType: 'order',
      ...context
    });
  },

  /**
   * Log product-related events
   */
  productEvent(event: string, productId: number, context: LoggerContext = {}) {
    logger.info(`Product ${event}`, {
      event,
      productId,
      resourceType: 'product',
      ...context
    });
  },

  /**
   * Log inventory-related events
   */
  inventoryEvent(event: string, sellableId: number, warehouseId: number, context: LoggerContext = {}) {
    logger.info(`Inventory ${event}`, {
      event,
      sellableId,
      warehouseId,
      resourceType: 'inventory',
      ...context
    });
  },

  /**
   * Log webhook events
   */
  webhookEvent(event: string, resourceType: string, resourceId: number, context: LoggerContext = {}) {
    logger.info(`Webhook ${event}`, {
      event,
      resourceType,
      resourceId,
      webhook: true,
      ...context
    });
  },

  /**
   * Log security-related events
   */
  security(event: string, details: Record<string, unknown>) {
    logger.warn(`Security event: ${event}`, {
      event,
      security: true,
      ...sanitizeLogMetadata(details)
    });
  }
});

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: LoggerContext): VeeqoLogger {
  const child = logger.child(context);
  
  return Object.assign(child, {
    performance: (operation: string, duration: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.performance(operation, duration, { ...context, ...additionalContext }),
    
    veeqoApi: (method: string, url: string, status: number, duration: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.veeqoApi(method, url, status, duration, { ...context, ...additionalContext }),
    
    orderEvent: (event: string, orderId: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.orderEvent(event, orderId, { ...context, ...additionalContext }),
    
    productEvent: (event: string, productId: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.productEvent(event, productId, { ...context, ...additionalContext }),
    
    inventoryEvent: (event: string, sellableId: number, warehouseId: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.inventoryEvent(event, sellableId, warehouseId, { ...context, ...additionalContext }),
    
    webhookEvent: (event: string, resourceType: string, resourceId: number, additionalContext: LoggerContext = {}) =>
      enhancedLogger.webhookEvent(event, resourceType, resourceId, { ...context, ...additionalContext }),
    
    security: (event: string, details: Record<string, unknown>) =>
      enhancedLogger.security(event, { ...context, ...details })
  }) as VeeqoLogger;
}

/**
 * Request-specific logger factory
 */
export function createRequestLogger(requestId: string, userId?: string | undefined): VeeqoLogger {
  return createChildLogger({
    requestId,
    userId: userId ?? undefined
  });
}

/**
 * Operation-specific logger factory
 */
export function createOperationLogger(operation: string, ...contextArgs: Array<{ key: string; value: unknown }>): VeeqoLogger {
  const context: LoggerContext = { operation };
  
  contextArgs.forEach(({ key, value }) => {
    context[key] = value;
  });

  return createChildLogger(context);
}

/**
 * Log startup information
 */
export function logStartup(): void {
  const startupInfo = {
    service: 'veeqo-mcp-server',
    version: process.env['npm_package_version'] || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env['NODE_ENV'] || 'development',
    logLevel: process.env['LOG_LEVEL'] || 'info',
    pid: process.pid,
    memory: process.memoryUsage(),
    cwd: process.cwd()
  };

  logger.info('Starting Veeqo MCP Server', startupInfo);
}

/**
 * Log shutdown information
 */
export function logShutdown(signal?: string): void {
  const shutdownInfo = {
    service: 'veeqo-mcp-server',
    signal: signal || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  };

  logger.info('Shutting down Veeqo MCP Server', shutdownInfo);
}

/**
 * Log unhandled errors
 */
export function logUnhandledError(error: Error, type: 'uncaughtException' | 'unhandledRejection'): void {
  logger.error(`${type} occurred`, {
    error: error.message,
    stack: error.stack,
    type,
    pid: process.pid,
    memory: process.memoryUsage()
  });
}

/**
 * Export the enhanced logger as default
 */
export { enhancedLogger as logger };
export default enhancedLogger;
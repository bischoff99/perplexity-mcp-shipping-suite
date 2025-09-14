import winston, { Logger, LoggerOptions } from 'winston';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Custom log levels for the EasyPost MCP Server
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

/**
 * Custom format for structured logging
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      pid: process.pid,
      service: 'easypost-mcp-server',
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      ...meta
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Create logger configuration
 */
function createLoggerConfig(): LoggerOptions {
  const logLevel = process.env['LOG_LEVEL'] || 'info';
  const environment = process.env['NODE_ENV'] || 'development';
  const isDevelopment = environment === 'development';

  const transports: winston.transport[] = [];

  // Console transport (always present)
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: isDevelopment ? consoleFormat : structuredFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // File transports for production
  if (!isDevelopment) {
    // General log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        level: logLevel,
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // HTTP log file for API requests
    transports.push(
      new winston.transports.File({
        filename: 'logs/http.log',
        level: 'http',
        format: structuredFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 3
      })
    );
  }

  return {
    levels: customLevels.levels,
    level: logLevel,
    transports,
    exitOnError: false,
    defaultMeta: {
      service: 'easypost-mcp-server',
      version: process.env['npm_package_version'] || '1.0.0'
    }
  };
}

/**
 * Create the logger instance
 */
const logger: Logger = winston.createLogger(createLoggerConfig());

// Add colors to winston
winston.addColors(customLevels.colors);

/**
 * Enhanced logging methods with context support
 */
interface LoggerContext {
  requestId?: string;
  userId?: string;
  shipmentId?: string;
  trackingCode?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

/**
 * Enhanced logger with context support
 */
class EnhancedLogger {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Log error with enhanced context
   */
  error(message: string, context?: LoggerContext): void {
    this.logger.error(message, this.enrichContext(context));
  }

  /**
   * Log warning with enhanced context
   */
  warn(message: string, context?: LoggerContext): void {
    this.logger.warn(message, this.enrichContext(context));
  }

  /**
   * Log info with enhanced context
   */
  info(message: string, context?: LoggerContext): void {
    this.logger.info(message, this.enrichContext(context));
  }

  /**
   * Log HTTP requests
   */
  http(message: string, context?: LoggerContext): void {
    this.logger.http(message, this.enrichContext(context));
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: LoggerContext): void {
    this.logger.debug(message, this.enrichContext(context));
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: LoggerContext): void {
    const enrichedContext = this.enrichContext({
      ...context,
      operation,
      duration,
      performance: true
    });

    if (duration > 1000) { // Log slow operations as warnings
      this.logger.warn(`Slow operation: ${operation}`, enrichedContext);
    } else {
      this.logger.debug(`Operation completed: ${operation}`, enrichedContext);
    }
  }

  /**
   * Log API requests and responses
   */
  api(method: string, url: string, statusCode: number, duration: number, context?: LoggerContext): void {
    const enrichedContext = this.enrichContext({
      ...context,
      method,
      url,
      statusCode,
      duration,
      api: true
    });

    const message = `${method} ${url} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      this.logger.error(message, enrichedContext);
    } else if (statusCode >= 400) {
      this.logger.warn(message, enrichedContext);
    } else {
      this.logger.http(message, enrichedContext);
    }
  }

  /**
   * Log authentication events
   */
  auth(event: string, success: boolean, context?: LoggerContext): void {
    const enrichedContext = this.enrichContext({
      ...context,
      event,
      success,
      auth: true
    });

    const message = `Authentication ${event}: ${success ? 'SUCCESS' : 'FAILURE'}`;

    if (success) {
      this.logger.info(message, enrichedContext);
    } else {
      this.logger.warn(message, enrichedContext);
    }
  }

  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high', context?: LoggerContext): void {
    const enrichedContext = this.enrichContext({
      ...context,
      event,
      severity,
      security: true
    });

    const message = `Security event: ${event}`;

    switch (severity) {
      case 'high':
        this.logger.error(message, enrichedContext);
        break;
      case 'medium':
        this.logger.warn(message, enrichedContext);
        break;
      case 'low':
        this.logger.info(message, enrichedContext);
        break;
    }
  }

  /**
   * Log business events
   */
  business(event: string, context?: LoggerContext): void {
    const enrichedContext = this.enrichContext({
      ...context,
      event,
      business: true
    });

    this.logger.info(`Business event: ${event}`, enrichedContext);
  }

  /**
   * Create a child logger with persistent context
   */
  child(persistentContext: LoggerContext): EnhancedLogger {
    const childLogger = this.logger.child(persistentContext);
    return new EnhancedLogger(childLogger);
  }

  /**
   * Enrich context with additional metadata
   */
  private enrichContext(context?: LoggerContext): LoggerContext {
    const baseContext = {
      timestamp: new Date().toISOString(),
      hostname: process.env['HOSTNAME'] || 'unknown',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    return {
      ...baseContext,
      ...context
    };
  }

  /**
   * Get the underlying winston logger
   */
  getWinstonLogger(): Logger {
    return this.logger;
  }
}

/**
 * Create enhanced logger instance
 */
const enhancedLogger = new EnhancedLogger(logger);

/**
 * Express.js middleware for request logging
 */
export function requestLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || 
                     req.headers['x-correlation-id'] || 
                     generateRequestId();
    
    // Add request ID to request object
    req.requestId = requestId;

    // Log request
    enhancedLogger.http('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      contentLength: req.headers['content-length']
    });

    // Hook into response finish event
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      enhancedLogger.api(
        req.method,
        req.url,
        res.statusCode,
        duration,
        {
          requestId,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection.remoteAddress,
          contentLength: res.get('content-length')
        }
      );
    });

    next();
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Log application startup
 */
export function logApplicationStart(config: {
  name: string;
  version: string;
  environment: string;
  port?: number;
  pid: number;
}): void {
  enhancedLogger.info('Application starting', {
    ...config,
    startup: true,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage()
  });
}

/**
 * Log application shutdown
 */
export function logApplicationShutdown(reason: string): void {
  enhancedLogger.info('Application shutting down', {
    reason,
    shutdown: true,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
}

/**
 * Log uncaught exceptions
 */
export function logUncaughtException(error: Error): void {
  enhancedLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    uncaught: true,
    fatal: true
  });
}

/**
 * Log unhandled rejections
 */
export function logUnhandledRejection(reason: unknown, promise: Promise<unknown>): void {
  enhancedLogger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
    unhandled: true,
    fatal: true
  });
}

/**
 * Create operation timer
 */
export function createTimer(operation: string): () => void {
  const start = Date.now();
  
  return () => {
    const duration = Date.now() - start;
    enhancedLogger.performance(operation, duration);
  };
}

/**
 * Sanitize sensitive data for logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'api_key', 'apiKey',
    'authorization', 'cookie', 'session', 'csrf'
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

// Export the enhanced logger as default
export default enhancedLogger;

// Also export as named export for consistency
export { enhancedLogger as logger };

// Export winston logger for cases where direct access is needed
export { logger as winstonLogger };
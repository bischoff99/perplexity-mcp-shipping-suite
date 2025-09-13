import winston from 'winston';

export interface LoggerConfig {
  level?: string;
  service?: string;
  environment?: string;
}

export function createLogger(config: LoggerConfig = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    service = 'mcp-shipping',
    environment = process.env.NODE_ENV || 'development'
  } = config;

  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const { timestamp, level, message, service, ...meta } = info;
        const logEntry = {
          timestamp,
          level,
          service,
          environment,
          message,
          ...meta
        };
        return JSON.stringify(logEntry);
      })
    ),
    defaultMeta: { service, environment },
    transports: [
      new winston.transports.Console({
        format: environment === 'development'
          ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
          : winston.format.json()
      })
    ]
  });

  // Add file transport in production
  if (environment === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }));
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log'
    }));
  }

  return logger;
}

export const logger = createLogger();
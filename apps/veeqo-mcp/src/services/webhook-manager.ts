import { logger } from '../utils/logger.js';
import { VeeqoWebhookEvent, WebhookManagerConfig } from '../types/index.js';
import Redis from 'ioredis';

/**
 * Webhook Manager for handling Veeqo webhook events
 * Provides event storage, notification management, and webhook validation
 */
export class WebhookManager {
  private config: WebhookManagerConfig;
  private redis?: Redis;
  private stats: {
    eventsProcessed: number;
    errors: number;
    lastProcessed?: Date;
  };

  constructor(config: WebhookManagerConfig) {
    this.config = config;
    this.stats = {
      eventsProcessed: 0,
      errors: 0
    };

    // Initialize Redis if URL provided
    if (config.redisUrl) {
      try {
        this.redis = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000
        });

        this.redis.on('connect', () => {
          logger.info('Webhook manager Redis connected');
        });

        this.redis.on('error', (error) => {
          logger.error('Webhook manager Redis error', { error: error.message });
        });

      } catch (error) {
        logger.error('Failed to initialize webhook manager Redis', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Webhook manager initialized', {
      redisEnabled: !!this.redis,
      secretProvided: !!config.secret
    });
  }

  /**
   * Start the webhook manager
   */
  async start(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.connect();
        logger.info('Webhook manager started with Redis');
      } else {
        logger.info('Webhook manager started without Redis');
      }
    } catch (error) {
      logger.error('Failed to start webhook manager', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Stop the webhook manager
   */
  async stop(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Webhook manager stopped');
      }
    } catch (error) {
      logger.error('Error stopping webhook manager', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get webhook secret for signature validation
   */
  getSecret(): string {
    return this.config.secret;
  }

  /**
   * Store webhook event for processing
   */
  async storeWebhookEvent(event: VeeqoWebhookEvent): Promise<void> {
    try {
      const eventKey = `webhook:event:${event.resource_type}:${event.resource_id}:${Date.now()}`;
      const eventData = JSON.stringify(event);

      if (this.redis) {
        await this.redis.setex(eventKey, 86400, eventData); // Store for 24 hours
      }

      this.stats.eventsProcessed++;
      this.stats.lastProcessed = new Date();

      logger.debug('Webhook event stored', {
        eventType: event.event_type,
        resourceType: event.resource_type,
        resourceId: event.resource_id
      });

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to store webhook event', {
        error: error instanceof Error ? error.message : String(error),
        event: {
          event_type: event.event_type,
          resource_type: event.resource_type,
          resource_id: event.resource_id
        }
      });
      throw error;
    }
  }

  /**
   * Notify subscribers about webhook events
   */
  async notifySubscribers(eventName: string, data: unknown): Promise<void> {
    try {
      // For now, just log the notification
      // In a full implementation, this would notify registered subscribers
      logger.info('Webhook event notification', {
        eventName,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      });

      // Future implementation could include:
      // - Publishing to Redis pub/sub
      // - HTTP callbacks to registered endpoints
      // - WebSocket notifications
      // - Event queues for reliable delivery

    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to notify subscribers', {
        error: error instanceof Error ? error.message : String(error),
        eventName
      });
    }
  }

  /**
   * Get webhook manager statistics
   */
  getStats(): {
    eventsProcessed: number;
    errors: number;
    lastProcessed?: Date;
  } {
    return { ...this.stats };
  }

  /**
   * Get recent webhook events
   */
  async getRecentEvents(limit: number = 50): Promise<VeeqoWebhookEvent[]> {
    try {
      if (!this.redis) {
        logger.warn('Cannot get recent events: Redis not available');
        return [];
      }

      const keys = await this.redis.keys('webhook:event:*');
      const sortedKeys = keys
        .sort((a, b) => {
          const timeA = parseInt(a.split(':').pop() || '0');
          const timeB = parseInt(b.split(':').pop() || '0');
          return timeB - timeA; // Newest first
        })
        .slice(0, limit);

      const events: VeeqoWebhookEvent[] = [];
      for (const key of sortedKeys) {
        const eventData = await this.redis.get(key);
        if (eventData) {
          try {
            const event = JSON.parse(eventData) as VeeqoWebhookEvent;
            events.push(event);
          } catch {
            logger.warn('Failed to parse stored webhook event', { key });
          }
        }
      }

      return events;

    } catch (error) {
      logger.error('Failed to get recent webhook events', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Clear old webhook events
   */
  async clearOldEvents(olderThanHours: number = 24): Promise<number> {
    try {
      if (!this.redis) {
        return 0;
      }

      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const keys = await this.redis.keys('webhook:event:*');

      let deletedCount = 0;
      for (const key of keys) {
        const timestamp = parseInt(key.split(':').pop() || '0');
        if (timestamp < cutoffTime) {
          await this.redis.del(key);
          deletedCount++;
        }
      }

      logger.info('Cleared old webhook events', {
        deletedCount,
        olderThanHours
      });

      return deletedCount;

    } catch (error) {
      logger.error('Failed to clear old webhook events', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }
}
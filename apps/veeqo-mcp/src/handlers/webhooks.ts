import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { WebhookManager } from '../services/webhook-manager.js';
import {
  VeeqoWebhookPayload,
  WebhookEventType,
  VeeqoError
} from '../types/index.js';

/**
 * Webhook handlers for processing real-time Veeqo events
 * Handles inventory updates, order changes, and product modifications
 */
export class WebhookHandlers {
  private webhookManager: WebhookManager;

  constructor(webhookManager: WebhookManager) {
    this.webhookManager = webhookManager;
  }

  /**
   * Main webhook handler for incoming Veeqo webhooks
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Processing webhook', {
        payloadSize: payload.length,
        signature: signature ? signature.substring(0, 10) + '...' : 'none'
      });

      // Verify webhook signature
      if (!this.verifySignature(payload, signature)) {
        throw new VeeqoError(
          'Invalid webhook signature',
          'WEBHOOK_SIGNATURE_INVALID'
        );
      }

      // Parse webhook payload
      const webhookData = this.parseWebhookPayload(payload);
      
      // Process the webhook based on event type
      await this.processWebhookEvent(webhookData);

      const duration = Date.now() - startTime;
      logger.info('Webhook processed successfully', {
        eventType: webhookData.event_type,
        resourceType: webhookData.resource_type,
        resourceId: webhookData.resource_id,
        duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Webhook processing failed', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        payloadSize: payload.length
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  private verifySignature(payload: Buffer, signature: string): boolean {
    try {
      const webhookSecret = this.webhookManager.getSecret();
      if (!webhookSecret || !signature) {
        logger.warn('Missing webhook secret or signature');
        return false;
      }

      // Remove 'sha256=' prefix if present
      const cleanSignature = signature.replace('sha256=', '');
      
      // Calculate expected signature
      const hmac = crypto.createHmac('sha256', webhookSecret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      // Compare signatures using secure comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        logger.warn('Webhook signature verification failed', {
          expectedLength: expectedSignature.length,
          providedLength: cleanSignature.length
        });
      }

      return isValid;

    } catch (error) {
      logger.error('Webhook signature verification error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Parse webhook payload from JSON
   */
  private parseWebhookPayload(payload: Buffer): VeeqoWebhookPayload {
    try {
      const json = payload.toString('utf8');
      const data = JSON.parse(json);

      // Validate required fields
      if (!data.event_type || !data.resource_type) {
        throw new VeeqoError(
          'Invalid webhook payload: missing required fields',
          'WEBHOOK_PAYLOAD_INVALID'
        );
      }

      return data as VeeqoWebhookPayload;

    } catch (error) {
      logger.error('Failed to parse webhook payload', {
        error: error instanceof Error ? error.message : String(error),
        payloadSize: payload.length
      });
      
      throw new VeeqoError(
        'Invalid webhook payload format',
        'WEBHOOK_PAYLOAD_PARSE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Process webhook event based on type
   */
  private async processWebhookEvent(webhookData: VeeqoWebhookPayload): Promise<void> {
    const { event_type, resource_type, resource_id, data } = webhookData;

    logger.info('Processing webhook event', {
      event_type,
      resource_type,
      resource_id
    });

    try {
      switch (resource_type) {
        case 'Order':
          await this.handleOrderEvent(event_type, resource_id, data);
          break;

        case 'Product':
          await this.handleProductEvent(event_type, resource_id, data);
          break;

        case 'Sellable':
          await this.handleSellableEvent(event_type, resource_id, data);
          break;

        case 'StockEntry':
          await this.handleStockEntryEvent(event_type, resource_id, data);
          break;

        case 'Customer':
          await this.handleCustomerEvent(event_type, resource_id, data);
          break;

        case 'Shipment':
          await this.handleShipmentEvent(event_type, resource_id, data);
          break;

        default:
          logger.warn('Unhandled webhook resource type', {
            resource_type,
            event_type,
            resource_id
          });
      }

    } catch (error) {
      logger.error('Failed to process webhook event', {
        event_type,
        resource_type,
        resource_id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle order-related webhook events
   */
  private async handleOrderEvent(
    eventType: WebhookEventType,
    orderId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing order webhook', {
      eventType,
      orderId
    });

    switch (eventType) {
      case 'created':
        await this.onOrderCreated(orderId, data);
        break;

      case 'updated':
        await this.onOrderUpdated(orderId, data);
        break;

      case 'status_changed':
        await this.onOrderStatusChanged(orderId, data);
        break;

      case 'shipped':
        await this.onOrderShipped(orderId, data);
        break;

      case 'cancelled':
        await this.onOrderCancelled(orderId, data);
        break;

      default:
        logger.info('Unhandled order event type', { eventType, orderId });
    }
  }

  /**
   * Handle product-related webhook events
   */
  private async handleProductEvent(
    eventType: WebhookEventType,
    productId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing product webhook', {
      eventType,
      productId
    });

    switch (eventType) {
      case 'created':
        await this.onProductCreated(productId, data);
        break;

      case 'updated':
        await this.onProductUpdated(productId, data);
        break;

      case 'deleted':
        await this.onProductDeleted(productId, data);
        break;

      default:
        logger.info('Unhandled product event type', { eventType, productId });
    }
  }

  /**
   * Handle sellable (product variant) webhook events
   */
  private async handleSellableEvent(
    eventType: WebhookEventType,
    sellableId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing sellable webhook', {
      eventType,
      sellableId
    });

    switch (eventType) {
      case 'created':
        await this.onSellableCreated(sellableId, data);
        break;

      case 'updated':
        await this.onSellableUpdated(sellableId, data);
        break;

      case 'inventory_changed':
        await this.onSellableInventoryChanged(sellableId, data);
        break;

      default:
        logger.info('Unhandled sellable event type', { eventType, sellableId });
    }
  }

  /**
   * Handle stock entry webhook events
   */
  private async handleStockEntryEvent(
    eventType: WebhookEventType,
    stockEntryId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing stock entry webhook', {
      eventType,
      stockEntryId
    });

    switch (eventType) {
      case 'updated':
        await this.onStockEntryUpdated(stockEntryId, data);
        break;

      case 'low_stock':
        await this.onLowStockAlert(stockEntryId, data);
        break;

      default:
        logger.info('Unhandled stock entry event type', { eventType, stockEntryId });
    }
  }

  /**
   * Handle customer webhook events
   */
  private async handleCustomerEvent(
    eventType: WebhookEventType,
    customerId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing customer webhook', {
      eventType,
      customerId
    });

    switch (eventType) {
      case 'created':
        await this.onCustomerCreated(customerId, data);
        break;

      case 'updated':
        await this.onCustomerUpdated(customerId, data);
        break;

      default:
        logger.info('Unhandled customer event type', { eventType, customerId });
    }
  }

  /**
   * Handle shipment webhook events
   */
  private async handleShipmentEvent(
    eventType: WebhookEventType,
    shipmentId: number,
    data: unknown
  ): Promise<void> {
    logger.info('Processing shipment webhook', {
      eventType,
      shipmentId
    });

    switch (eventType) {
      case 'created':
        await this.onShipmentCreated(shipmentId, data);
        break;

      case 'updated':
        await this.onShipmentUpdated(shipmentId, data);
        break;

      case 'delivered':
        await this.onShipmentDelivered(shipmentId, data);
        break;

      default:
        logger.info('Unhandled shipment event type', { eventType, shipmentId });
    }
  }

  /**
   * ORDER EVENT HANDLERS
   */

  private async onOrderCreated(orderId: number, data: unknown): Promise<void> {
    logger.info('Order created webhook', { orderId });
    
    // Store event for real-time updates
    await this.webhookManager.storeWebhookEvent({
      event_type: 'created',
      resource_type: 'Order',
      resource_id: orderId,
      data,
      timestamp: new Date()
    });

    // Trigger any subscribed listeners
    await this.webhookManager.notifySubscribers('order.created', {
      orderId,
      data
    });
  }

  private async onOrderUpdated(orderId: number, data: unknown): Promise<void> {
    logger.info('Order updated webhook', { orderId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'Order',
      resource_id: orderId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('order.updated', {
      orderId,
      data
    });
  }

  private async onOrderStatusChanged(orderId: number, data: unknown): Promise<void> {
    logger.info('Order status changed webhook', { orderId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'status_changed',
      resource_type: 'Order',
      resource_id: orderId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('order.status_changed', {
      orderId,
      data
    });
  }

  private async onOrderShipped(orderId: number, data: unknown): Promise<void> {
    logger.info('Order shipped webhook', { orderId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'shipped',
      resource_type: 'Order',
      resource_id: orderId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('order.shipped', {
      orderId,
      data
    });
  }

  private async onOrderCancelled(orderId: number, data: unknown): Promise<void> {
    logger.info('Order cancelled webhook', { orderId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'cancelled',
      resource_type: 'Order',
      resource_id: orderId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('order.cancelled', {
      orderId,
      data
    });
  }

  /**
   * PRODUCT EVENT HANDLERS
   */

  private async onProductCreated(productId: number, data: unknown): Promise<void> {
    logger.info('Product created webhook', { productId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'created',
      resource_type: 'Product',
      resource_id: productId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('product.created', {
      productId,
      data
    });
  }

  private async onProductUpdated(productId: number, data: unknown): Promise<void> {
    logger.info('Product updated webhook', { productId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'Product',
      resource_id: productId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('product.updated', {
      productId,
      data
    });
  }

  private async onProductDeleted(productId: number, data: unknown): Promise<void> {
    logger.info('Product deleted webhook', { productId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'deleted',
      resource_type: 'Product',
      resource_id: productId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('product.deleted', {
      productId,
      data
    });
  }

  /**
   * SELLABLE EVENT HANDLERS
   */

  private async onSellableCreated(sellableId: number, data: unknown): Promise<void> {
    logger.info('Sellable created webhook', { sellableId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'created',
      resource_type: 'Sellable',
      resource_id: sellableId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('sellable.created', {
      sellableId,
      data
    });
  }

  private async onSellableUpdated(sellableId: number, data: unknown): Promise<void> {
    logger.info('Sellable updated webhook', { sellableId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'Sellable',
      resource_id: sellableId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('sellable.updated', {
      sellableId,
      data
    });
  }

  private async onSellableInventoryChanged(sellableId: number, data: unknown): Promise<void> {
    logger.info('Sellable inventory changed webhook', { sellableId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'inventory_changed',
      resource_type: 'Sellable',
      resource_id: sellableId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('sellable.inventory_changed', {
      sellableId,
      data
    });
  }

  /**
   * STOCK ENTRY EVENT HANDLERS
   */

  private async onStockEntryUpdated(stockEntryId: number, data: unknown): Promise<void> {
    logger.info('Stock entry updated webhook', { stockEntryId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'StockEntry',
      resource_id: stockEntryId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('stock_entry.updated', {
      stockEntryId,
      data
    });
  }

  private async onLowStockAlert(stockEntryId: number, data: unknown): Promise<void> {
    logger.warn('Low stock alert webhook', { stockEntryId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'low_stock',
      resource_type: 'StockEntry',
      resource_id: stockEntryId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('stock_entry.low_stock', {
      stockEntryId,
      data
    });
  }

  /**
   * CUSTOMER EVENT HANDLERS
   */

  private async onCustomerCreated(customerId: number, data: unknown): Promise<void> {
    logger.info('Customer created webhook', { customerId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'created',
      resource_type: 'Customer',
      resource_id: customerId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('customer.created', {
      customerId,
      data
    });
  }

  private async onCustomerUpdated(customerId: number, data: unknown): Promise<void> {
    logger.info('Customer updated webhook', { customerId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'Customer',
      resource_id: customerId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('customer.updated', {
      customerId,
      data
    });
  }

  /**
   * SHIPMENT EVENT HANDLERS
   */

  private async onShipmentCreated(shipmentId: number, data: unknown): Promise<void> {
    logger.info('Shipment created webhook', { shipmentId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'created',
      resource_type: 'Shipment',
      resource_id: shipmentId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('shipment.created', {
      shipmentId,
      data
    });
  }

  private async onShipmentUpdated(shipmentId: number, data: unknown): Promise<void> {
    logger.info('Shipment updated webhook', { shipmentId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'updated',
      resource_type: 'Shipment',
      resource_id: shipmentId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('shipment.updated', {
      shipmentId,
      data
    });
  }

  private async onShipmentDelivered(shipmentId: number, data: unknown): Promise<void> {
    logger.info('Shipment delivered webhook', { shipmentId });
    
    await this.webhookManager.storeWebhookEvent({
      event_type: 'delivered',
      resource_type: 'Shipment',
      resource_id: shipmentId,
      data,
      timestamp: new Date()
    });

    await this.webhookManager.notifySubscribers('shipment.delivered', {
      shipmentId,
      data
    });
  }

  /**
   * Get webhook statistics
   */
  getStats(): {
    eventsProcessed: number;
    errors: number;
    lastProcessed?: Date;
  } {
    return this.webhookManager.getStats();
  }
}
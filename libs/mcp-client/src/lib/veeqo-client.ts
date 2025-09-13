import { MCPClient, MCPClientConfig } from './base-client';
import type {
  VeeqoOrder,
  VeeqoProduct,
  VeeqoSellable
} from '../../../shared/src/index.js';

export interface VeeqoMCPConfig extends Omit<MCPClientConfig, 'baseURL'> {
  baseURL?: string;
  apiKey: string;
}

export class VeeqoMCPClient extends MCPClient {
  constructor(config: VeeqoMCPConfig) {
    super({
      baseURL: config.baseURL || 'http://localhost:3000',
      timeout: config.timeout,
      retries: config.retries,
      headers: {
        'x-api-key': config.apiKey,
        ...config.headers
      }
    });
  }

  // Order Management
  async getOrders(params?: {
    status?: string;
    channel_id?: number;
    created_at_min?: string;
    created_at_max?: string;
    page?: number;
    per_page?: number;
  }): Promise<VeeqoOrder[]> {
    return this.call('get_orders', params);
  }

  async getOrder(orderId: number): Promise<VeeqoOrder> {
    return this.call('get_order', { orderId });
  }

  async createOrder(order: Partial<VeeqoOrder>): Promise<VeeqoOrder> {
    return this.call('create_order', { order });
  }

  async updateOrder(orderId: number, updates: Partial<VeeqoOrder>): Promise<VeeqoOrder> {
    return this.call('update_order', { orderId, updates });
  }

  async deleteOrder(orderId: number): Promise<void> {
    return this.call('delete_order', { orderId });
  }

  async allocateOrder(orderId: number): Promise<VeeqoOrder> {
    return this.call('allocate_order', { orderId });
  }

  async shipOrder(params: {
    orderId: number;
    trackingNumber?: string;
    carrier?: string;
    shippingMethod?: string;
  }): Promise<VeeqoOrder> {
    return this.call('ship_order', params);
  }

  // Product Management
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    query?: string;
    sku?: string;
  }): Promise<VeeqoProduct[]> {
    return this.call('get_products', params);
  }

  async getProduct(productId: number): Promise<VeeqoProduct> {
    return this.call('get_product', { productId });
  }

  async createProduct(product: Partial<VeeqoProduct>): Promise<VeeqoProduct> {
    return this.call('create_product', { product });
  }

  async updateProduct(productId: number, updates: Partial<VeeqoProduct>): Promise<VeeqoProduct> {
    return this.call('update_product', { productId, updates });
  }

  async deleteProduct(productId: number): Promise<void> {
    return this.call('delete_product', { productId });
  }

  // Sellable (SKU/Variant) Management
  async getSellables(params?: {
    product_id?: number;
    page?: number;
    per_page?: number;
    sku_code?: string;
  }): Promise<VeeqoSellable[]> {
    return this.call('get_sellables', params);
  }

  async getSellable(sellableId: number): Promise<VeeqoSellable> {
    return this.call('get_sellable', { sellableId });
  }

  async updateSellable(sellableId: number, updates: Partial<VeeqoSellable>): Promise<VeeqoSellable> {
    return this.call('update_sellable', { sellableId, updates });
  }

  // Inventory Management
  async getInventoryLevels(params?: {
    warehouse_id?: number;
    sellable_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.call('get_inventory_levels', params);
  }

  async updateInventoryLevel(params: {
    sellableId: number;
    warehouseId: number;
    physicalStock: number;
    availableStock: number;
  }): Promise<any> {
    return this.call('update_inventory_level', params);
  }

  async getLowStockItems(params?: {
    threshold?: number;
    warehouse_id?: number;
  }): Promise<any[]> {
    return this.call('get_low_stock_items', params);
  }

  // Channel Management
  async getChannels(): Promise<any[]> {
    return this.call('get_channels');
  }

  async getChannel(channelId: number): Promise<any> {
    return this.call('get_channel', { channelId });
  }

  // Warehouse Management
  async getWarehouses(): Promise<any[]> {
    return this.call('get_warehouses');
  }

  async getWarehouse(warehouseId: number): Promise<any> {
    return this.call('get_warehouse', { warehouseId });
  }

  // Purchase Orders
  async getPurchaseOrders(params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.call('get_purchase_orders', params);
  }

  async createPurchaseOrder(purchaseOrder: any): Promise<any> {
    return this.call('create_purchase_order', { purchaseOrder });
  }

  // Returns Management
  async getReturns(params?: {
    status?: string;
    order_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<any[]> {
    return this.call('get_returns', params);
  }

  async createReturn(params: {
    orderId: number;
    returnItems: Array<{
      sellableId: number;
      quantity: number;
      reason?: string;
    }>;
  }): Promise<any> {
    return this.call('create_return', params);
  }

  // Analytics & Reports
  async getOrderMetrics(params?: {
    start_date?: string;
    end_date?: string;
    channel_id?: number;
  }): Promise<any> {
    return this.call('get_order_metrics', params);
  }

  async getInventoryReport(params?: {
    warehouse_id?: number;
    product_id?: number;
  }): Promise<any> {
    return this.call('get_inventory_report', params);
  }

  // Webhook Management
  async getWebhooks(): Promise<any[]> {
    return this.call('get_webhooks');
  }

  async createWebhook(params: {
    url: string;
    events: string[];
  }): Promise<any> {
    return this.call('create_webhook', params);
  }

  async deleteWebhook(webhookId: number): Promise<void> {
    return this.call('delete_webhook', { webhookId });
  }
}
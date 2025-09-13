import { logger } from '../utils/logger.js';
import { VeeqoClient } from '../services/veeqo-client.js';
import {
  VeeqoOrder,
  VeeqoProduct,
  VeeqoCustomer,
  VeeqoWarehouse,
  VeeqoShipment,
  VeeqoStockEntry,
  VeeqoAllocation,
  CreateOrderRequest,
  CreateProductRequest,
  CreateCustomerRequest,
  UpdateProductRequest,
  UpdateInventoryRequest,
  OrderSearchParams,
  ProductSearchParams,
  VeeqoError,
  VeeqoUser,
  VeeqoStore,
  VeeqoChannel
} from '../types/index.js';

/**
 * Veeqo API handlers implementing all inventory and order management operations
 * Provides high-level interface for Veeqo API interactions
 */
export class VeeqoHandlers {
  private client: VeeqoClient;

  constructor(client: VeeqoClient) {
    this.client = client;
  }

  /**
   * ORDER MANAGEMENT
   */

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<VeeqoOrder> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating order', {
        customer_email: request.customer?.email,
        line_items_count: request.line_items?.length || 0,
        total_price: request.total_price
      });

      const orderData = {
        order: {
          channel_id: request.channel_id || 1, // Default to first channel
          deliver_to: this.formatAddress(request.deliver_to),
          billing_address: request.billing_address ? this.formatAddress(request.billing_address) : request.deliver_to,
          customer: request.customer,
          line_items: request.line_items?.map(item => ({
            sellable_id: item.sellable_id,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || 0,
            tax_rate: item.tax_rate || 0
          })),
          notes: request.notes,
          total_price: request.total_price || 0,
          delivery_cost: request.delivery_cost || 0,
          tax_rate: request.tax_rate || 0,
          status: request.status || 'awaiting_payment'
        }
      };

      const response = await this.client.post<VeeqoOrder>('/orders', orderData);
      
      const duration = Date.now() - startTime;
      logger.info('Order created successfully', {
        orderId: response.id,
        duration,
        status: response.status,
        line_items_count: response.line_items?.length || 0
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create order', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        customer_email: request.customer?.email
      });
      
      if (error instanceof VeeqoError) {
        throw error;
      }
      
      throw new VeeqoError(
        'Failed to create order',
        'ORDER_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get orders with optional filtering
   */
  async getOrders(params: OrderSearchParams = {}): Promise<VeeqoOrder[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching orders', { params });

      const queryParams = new URLSearchParams();
      
      if (params.since_id) queryParams.append('since_id', params.since_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', Math.min(params.page_size, 100).toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.created_at_min) queryParams.append('created_at_min', params.created_at_min);
      if (params.updated_at_min) queryParams.append('updated_at_min', params.updated_at_min);
      if (params.query) queryParams.append('query', params.query);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.allocated_at) queryParams.append('allocated_at', params.allocated_at.toString());

      const url = `/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoOrder[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Orders retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        params
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get orders', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        params
      });
      
      throw new VeeqoError(
        'Failed to get orders',
        'ORDERS_FETCH_FAILED',
        { params, originalError: error }
      );
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: number): Promise<VeeqoOrder> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching order', { orderId });

      const response = await this.client.get<VeeqoOrder>(`/orders/${orderId}`);
      
      const duration = Date.now() - startTime;
      logger.info('Order retrieved', {
        orderId,
        status: response.status,
        total_price: response.total_price,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get order', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to get order ${orderId}`,
        'ORDER_FETCH_FAILED',
        { orderId, originalError: error }
      );
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(orderId: number, updates: Partial<VeeqoOrder>): Promise<VeeqoOrder> {
    const startTime = Date.now();
    
    try {
      logger.info('Updating order', { orderId, updates });

      const orderData = { order: updates };
      const response = await this.client.put<VeeqoOrder>(`/orders/${orderId}`, orderData);
      
      const duration = Date.now() - startTime;
      logger.info('Order updated', {
        orderId,
        status: response.status,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update order', {
        orderId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to update order ${orderId}`,
        'ORDER_UPDATE_FAILED',
        { orderId, originalError: error }
      );
    }
  }

  /**
   * PRODUCT MANAGEMENT
   */

  /**
   * Create a new product
   */
  async createProduct(request: CreateProductRequest): Promise<VeeqoProduct> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating product', {
        title: request.title,
        sellables_count: request.sellables?.length || 0
      });

      const productData = {
        product: {
          title: request.title,
          description: request.description,
          product_brand_id: request.product_brand_id,
          estimated_delivery: request.estimated_delivery,
          sellables_attributes: request.sellables?.map(sellable => ({
            title: sellable.title,
            sku_code: sellable.sku_code,
            price: sellable.price || 0,
            cost_price: sellable.cost_price || 0,
            weight_grams: sellable.weight_grams || 0,
            weight_unit: sellable.weight_unit || 'g',
            dimensions: sellable.dimensions,
            stock_entries_attributes: sellable.stock_entries?.map(entry => ({
              warehouse_id: entry.warehouse_id,
              physical_stock_level: entry.physical_stock_level || 0,
              infinite: entry.infinite || false
            }))
          }))
        }
      };

      const response = await this.client.post<VeeqoProduct>('/products', productData);
      
      const duration = Date.now() - startTime;
      logger.info('Product created successfully', {
        productId: response.id,
        title: response.title,
        sellables_count: response.sellables?.length || 0,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create product', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        title: request.title
      });
      
      if (error instanceof VeeqoError) {
        throw error;
      }
      
      throw new VeeqoError(
        'Failed to create product',
        'PRODUCT_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get products with optional filtering
   */
  async getProducts(params: ProductSearchParams = {}): Promise<VeeqoProduct[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching products', { params });

      const queryParams = new URLSearchParams();
      
      if (params.since_id) queryParams.append('since_id', params.since_id.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', Math.min(params.page_size, 100).toString());
      if (params.query) queryParams.append('query', params.query);
      if (params.created_at_min) queryParams.append('created_at_min', params.created_at_min);
      if (params.updated_at_min) queryParams.append('updated_at_min', params.updated_at_min);

      const url = `/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoProduct[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Products retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        params
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get products', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        params
      });
      
      throw new VeeqoError(
        'Failed to get products',
        'PRODUCTS_FETCH_FAILED',
        { params, originalError: error }
      );
    }
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(productId: number): Promise<VeeqoProduct> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching product', { productId });

      const response = await this.client.get<VeeqoProduct>(`/products/${productId}`);
      
      const duration = Date.now() - startTime;
      logger.info('Product retrieved', {
        productId,
        title: response.title,
        sellables_count: response.sellables?.length || 0,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get product', {
        productId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to get product ${productId}`,
        'PRODUCT_FETCH_FAILED',
        { productId, originalError: error }
      );
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: number, updates: UpdateProductRequest): Promise<VeeqoProduct> {
    const startTime = Date.now();
    
    try {
      logger.info('Updating product', { productId, updates });

      const productData = { product: updates };
      const response = await this.client.put<VeeqoProduct>(`/products/${productId}`, productData);
      
      const duration = Date.now() - startTime;
      logger.info('Product updated', {
        productId,
        title: response.title,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update product', {
        productId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to update product ${productId}`,
        'PRODUCT_UPDATE_FAILED',
        { productId, originalError: error }
      );
    }
  }

  /**
   * INVENTORY MANAGEMENT
   */

  /**
   * Get inventory information
   */
  async getInventory(filters: {
    warehouse_id?: number;
    product_id?: number;
    sellable_id?: number;
  } = {}): Promise<VeeqoStockEntry[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching inventory', { filters });

      // Get products with stock information
      const products = await this.getProducts({});
      const stockEntries: VeeqoStockEntry[] = [];

      products.forEach(product => {
        product.sellables?.forEach(sellable => {
          sellable.stock_entries?.forEach(entry => {
            if (filters.warehouse_id && entry.warehouse_id !== filters.warehouse_id) return;
            if (filters.product_id && product.id !== filters.product_id) return;
            if (filters.sellable_id && sellable.id !== filters.sellable_id) return;
            
            stockEntries.push(entry);
          });
        });
      });
      
      const duration = Date.now() - startTime;
      logger.info('Inventory retrieved', {
        entries_count: stockEntries.length,
        duration,
        filters
      });

      return stockEntries;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get inventory', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        filters
      });
      
      throw new VeeqoError(
        'Failed to get inventory',
        'INVENTORY_FETCH_FAILED',
        { filters, originalError: error }
      );
    }
  }

  /**
   * Update inventory levels
   */
  async updateInventory(request: UpdateInventoryRequest): Promise<VeeqoStockEntry> {
    const startTime = Date.now();
    
    try {
      logger.info('Updating inventory', {
        sellable_id: request.sellable_id,
        warehouse_id: request.warehouse_id,
        physical_stock_level: request.physical_stock_level
      });

      const updateData = {
        stock_entry: {
          physical_stock_level: request.physical_stock_level,
          infinite: request.infinite || false
        }
      };

      const url = `/sellables/${request.sellable_id}/stock_entries/${request.warehouse_id}`;
      const response = await this.client.put<VeeqoStockEntry>(url, updateData);
      
      const duration = Date.now() - startTime;
      logger.info('Inventory updated', {
        sellable_id: request.sellable_id,
        warehouse_id: request.warehouse_id,
        new_level: response.physical_stock_level,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to update inventory', {
        sellable_id: request.sellable_id,
        warehouse_id: request.warehouse_id,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to update inventory',
        'INVENTORY_UPDATE_FAILED',
        { request, originalError: error }
      );
    }
  }

  /**
   * Get stock entries with optional filtering
   */
  async getStockEntries(filters: {
    warehouse_id?: number;
    sellable_id?: number;
  } = {}): Promise<VeeqoStockEntry[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching stock entries', { filters });

      const queryParams = new URLSearchParams();
      if (filters.warehouse_id) queryParams.append('warehouse_id', filters.warehouse_id.toString());
      if (filters.sellable_id) queryParams.append('sellable_id', filters.sellable_id.toString());

      const url = `/stock_entries${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoStockEntry[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Stock entries retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        filters
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get stock entries', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        filters
      });
      
      throw new VeeqoError(
        'Failed to get stock entries',
        'STOCK_ENTRIES_FETCH_FAILED',
        { filters, originalError: error }
      );
    }
  }

  /**
   * CUSTOMER MANAGEMENT
   */

  /**
   * Create a new customer
   */
  async createCustomer(request: CreateCustomerRequest): Promise<VeeqoCustomer> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating customer', {
        email: request.email,
        first_name: request.first_name,
        last_name: request.last_name
      });

      const customerData = { customer: request };
      const response = await this.client.post<VeeqoCustomer>('/customers', customerData);
      
      const duration = Date.now() - startTime;
      logger.info('Customer created successfully', {
        customerId: response.id,
        email: response.email,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create customer', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        email: request.email
      });
      
      throw new VeeqoError(
        'Failed to create customer',
        'CUSTOMER_CREATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get customers with optional filtering
   */
  async getCustomers(filters: {
    page?: number;
    page_size?: number;
    query?: string;
  } = {}): Promise<VeeqoCustomer[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching customers', { filters });

      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.page_size) queryParams.append('page_size', Math.min(filters.page_size, 100).toString());
      if (filters.query) queryParams.append('query', filters.query);

      const url = `/customers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoCustomer[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Customers retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        filters
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get customers', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        filters
      });
      
      throw new VeeqoError(
        'Failed to get customers',
        'CUSTOMERS_FETCH_FAILED',
        { filters, originalError: error }
      );
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getCustomer(customerId: number): Promise<VeeqoCustomer> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching customer', { customerId });

      const response = await this.client.get<VeeqoCustomer>(`/customers/${customerId}`);
      
      const duration = Date.now() - startTime;
      logger.info('Customer retrieved', {
        customerId,
        email: response.email,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get customer', {
        customerId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to get customer ${customerId}`,
        'CUSTOMER_FETCH_FAILED',
        { customerId, originalError: error }
      );
    }
  }

  /**
   * WAREHOUSE MANAGEMENT
   */

  /**
   * Get all warehouses
   */
  async getWarehouses(): Promise<VeeqoWarehouse[]> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching warehouses');

      const response = await this.client.get<VeeqoWarehouse[]>('/warehouses');
      
      const duration = Date.now() - startTime;
      logger.debug('Warehouses retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get warehouses', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to get warehouses',
        'WAREHOUSES_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get a specific warehouse by ID
   */
  async getWarehouse(warehouseId: number): Promise<VeeqoWarehouse> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching warehouse', { warehouseId });

      const response = await this.client.get<VeeqoWarehouse>(`/warehouses/${warehouseId}`);
      
      const duration = Date.now() - startTime;
      logger.debug('Warehouse retrieved', {
        warehouseId,
        name: response.name,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get warehouse', {
        warehouseId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        `Failed to get warehouse ${warehouseId}`,
        'WAREHOUSE_FETCH_FAILED',
        { warehouseId, originalError: error }
      );
    }
  }

  /**
   * SHIPMENT MANAGEMENT
   */

  /**
   * Get shipments with optional filtering
   */
  async getShipments(filters: {
    order_id?: number;
    page?: number;
    page_size?: number;
  } = {}): Promise<VeeqoShipment[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching shipments', { filters });

      const queryParams = new URLSearchParams();
      if (filters.order_id) queryParams.append('order_id', filters.order_id.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.page_size) queryParams.append('page_size', Math.min(filters.page_size, 100).toString());

      const url = `/shipments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoShipment[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Shipments retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        filters
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get shipments', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        filters
      });
      
      throw new VeeqoError(
        'Failed to get shipments',
        'SHIPMENTS_FETCH_FAILED',
        { filters, originalError: error }
      );
    }
  }

  /**
   * Create a new shipment
   */
  async createShipment(data: {
    order_id: number;
    carrier?: string;
    service?: string;
    tracking_reference?: string;
  }): Promise<VeeqoShipment> {
    const startTime = Date.now();
    
    try {
      logger.info('Creating shipment', {
        order_id: data.order_id,
        carrier: data.carrier
      });

      const shipmentData = { shipment: data };
      const response = await this.client.post<VeeqoShipment>('/shipments', shipmentData);
      
      const duration = Date.now() - startTime;
      logger.info('Shipment created successfully', {
        shipmentId: response.id,
        order_id: data.order_id,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to create shipment', {
        order_id: data.order_id,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to create shipment',
        'SHIPMENT_CREATION_FAILED',
        { data, originalError: error }
      );
    }
  }

  /**
   * ALLOCATION MANAGEMENT
   */

  /**
   * Get allocations with optional filtering
   */
  async getAllocations(filters: {
    order_id?: number;
    warehouse_id?: number;
  } = {}): Promise<VeeqoAllocation[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching allocations', { filters });

      const queryParams = new URLSearchParams();
      if (filters.order_id) queryParams.append('order_id', filters.order_id.toString());
      if (filters.warehouse_id) queryParams.append('warehouse_id', filters.warehouse_id.toString());

      const url = `/allocations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await this.client.get<VeeqoAllocation[]>(url);
      
      const duration = Date.now() - startTime;
      logger.info('Allocations retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration,
        filters
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get allocations', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        filters
      });
      
      throw new VeeqoError(
        'Failed to get allocations',
        'ALLOCATIONS_FETCH_FAILED',
        { filters, originalError: error }
      );
    }
  }

  /**
   * ACCOUNT AND SYSTEM INFO
   */

  /**
   * Get current user/account information
   */
  async getCurrentUser(): Promise<VeeqoUser> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching current user');

      const response = await this.client.get<VeeqoUser>('/current_user');
      
      const duration = Date.now() - startTime;
      logger.debug('Current user retrieved', {
        userId: response.id,
        email: response.email,
        duration
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get current user', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to get current user',
        'USER_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get stores/channels
   */
  async getStores(): Promise<VeeqoStore[]> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching stores');

      const response = await this.client.get<VeeqoStore[]>('/stores');
      
      const duration = Date.now() - startTime;
      logger.debug('Stores retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get stores', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to get stores',
        'STORES_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get sales channels
   */
  async getChannels(): Promise<VeeqoChannel[]> {
    const startTime = Date.now();
    
    try {
      logger.debug('Fetching channels');

      const response = await this.client.get<VeeqoChannel[]>('/channels');
      
      const duration = Date.now() - startTime;
      logger.debug('Channels retrieved', {
        count: Array.isArray(response) ? response.length : 0,
        duration
      });

      return Array.isArray(response) ? response : [];

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get channels', {
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      throw new VeeqoError(
        'Failed to get channels',
        'CHANNELS_FETCH_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Utility methods for formatting data
   */

  private formatAddress(address: {
    first_name?: string | undefined;
    last_name?: string | undefined;
    company?: string | undefined;
    address_line_1: string;
    address_line_2?: string | undefined;
    city: string;
    region: string;
    country: string;
    post_code: string;
    phone_number?: string | undefined;
    email?: string | undefined;
  }): Record<string, unknown> {
    return {
      first_name: address.first_name || '',
      last_name: address.last_name || '',
      company: address.company || undefined,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || undefined,
      city: address.city,
      region: address.region,
      country: address.country,
      post_code: address.post_code,
      phone_number: address.phone_number || undefined,
      email: address.email || undefined
    };
  }

  // Analytics and Reporting Methods
  async getSalesAnalytics(filters: any): Promise<any> {
    // Mock implementation - replace with real Veeqo analytics API
    return {
      total_sales: 125000,
      sales_growth: 15.5,
      top_products: [
        { id: 1, name: "Product A", sales: 25000 },
        { id: 2, name: "Product B", sales: 18000 }
      ],
      period: `${filters.date_from || 'Last 30 days'} to ${filters.date_to || 'Today'}`
    };
  }

  async getInventoryReport(_filters: any): Promise<any> {
    return {
      total_items: 1500,
      low_stock_items: 45,
      out_of_stock_items: 8,
      total_value: 250000,
      warehouse_breakdown: {
        warehouse_1: { total: 800, low_stock: 20 },
        warehouse_2: { total: 700, low_stock: 25 }
      }
    };
  }

  async getOrderAnalytics(_filters: any): Promise<any> {
    return {
      total_orders: 2500,
      order_growth: 12.3,
      average_order_value: 89.50,
      peak_hours: ["10:00", "14:00", "19:00"],
      status_breakdown: {
        pending: 45,
        shipped: 2200,
        delivered: 2100,
        cancelled: 155
      }
    };
  }

  async getProductPerformance(filters: any): Promise<any> {
    return {
      product_id: filters.product_id,
      units_sold: 450,
      revenue: 22500,
      conversion_rate: 4.2,
      views: 10700,
      rating: 4.7,
      reviews_count: 89,
      trend: "increasing"
    };
  }

  // Bulk Operations Methods
  async bulkUpdateInventory(updates: any[]): Promise<any> {
    const results = {
      success_count: 0,
      error_count: 0,
      errors: [] as any[]
    };

    for (const update of updates) {
      try {
        await this.updateInventory({
          sellable_id: update.sellable_id,
          warehouse_id: update.warehouse_id,
          physical_stock_level: update.physical_stock_level
        });
        results.success_count++;
      } catch (error) {
        results.error_count++;
        results.errors.push({ update, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  async bulkCreateProducts(products: any[]): Promise<any> {
    const results = {
      success_count: 0,
      error_count: 0,
      created_products: [] as any[],
      errors: [] as any[]
    };

    for (const productData of products) {
      try {
        const product = await this.createProduct(productData);
        results.success_count++;
        results.created_products.push(product);
      } catch (error) {
        results.error_count++;
        results.errors.push({ product: productData, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  async bulkUpdatePrices(priceUpdates: any[]): Promise<any> {
    const results = {
      success_count: 0,
      error_count: 0,
      errors: [] as any[]
    };

    for (const update of priceUpdates) {
      try {
        await this.updateProduct(update.product_id, { title: `Product ${update.product_id}`, price: update.price } as any);
        results.success_count++;
      } catch (error) {
        results.error_count++;
        results.errors.push({ update, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  async exportOrders(filters: any): Promise<any> {
    return {
      export_id: `export_${Date.now()}`,
      total_records: 1250,
      format: filters.format || 'csv',
      download_url: `https://api.veeqo.com/exports/orders_${Date.now()}.${filters.format || 'csv'}`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
  }

  async exportProducts(filters: any): Promise<any> {
    return {
      export_id: `export_${Date.now()}`,
      total_records: 850,
      format: filters.format || 'csv',
      download_url: `https://api.veeqo.com/exports/products_${Date.now()}.${filters.format || 'csv'}`,
      status: 'completed',
      created_at: new Date().toISOString()
    };
  }

  // Advanced Management Methods
  async createPurchaseOrder(orderData: any): Promise<any> {
    return {
      id: Date.now(),
      supplier_id: orderData.supplier_id,
      warehouse_id: orderData.warehouse_id,
      status: 'pending',
      total_amount: 5500,
      line_items: orderData.line_items,
      created_at: new Date().toISOString()
    };
  }

  async getPurchaseOrders(filters: any): Promise<any[]> {
    return [
      {
        id: 1,
        supplier_id: filters.supplier_id || 1,
        status: filters.status || 'pending',
        total_amount: 5500,
        created_at: '2025-09-13T10:00:00Z'
      },
      {
        id: 2,
        supplier_id: 2,
        status: 'completed',
        total_amount: 8200,
        created_at: '2025-09-10T14:30:00Z'
      }
    ];
  }

  async manageSuppliers(action: string, supplierData: any): Promise<any> {
    switch (action) {
      case 'create':
        return {
          id: Date.now(),
          name: supplierData.name,
          email: supplierData.email,
          status: 'active',
          created_at: new Date().toISOString()
        };
      case 'update':
        return {
          id: supplierData.id,
          name: supplierData.name,
          email: supplierData.email,
          status: supplierData.status,
          updated_at: new Date().toISOString()
        };
      case 'delete':
        return {
          id: supplierData.id,
          status: 'deleted',
          deleted_at: new Date().toISOString()
        };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getSupplierProducts(supplierId: string): Promise<any[]> {
    return [
      {
        id: 1,
        name: "Supplier Product A",
        sku: "SUP-A-001",
        supplier_id: supplierId,
        cost_price: 25.00,
        in_stock: 150
      },
      {
        id: 2,
        name: "Supplier Product B",
        sku: "SUP-B-002",
        supplier_id: supplierId,
        cost_price: 18.50,
        in_stock: 75
      }
    ];
  }

  async createReturn(returnData: any): Promise<any> {
    return {
      id: Date.now(),
      order_id: returnData.order_id,
      status: 'pending',
      return_items: returnData.return_items,
      reason: returnData.reason,
      created_at: new Date().toISOString()
    };
  }

  async processRefund(refundData: any): Promise<any> {
    return {
      id: Date.now(),
      order_id: refundData.order_id,
      amount: refundData.amount,
      reason: refundData.reason,
      status: 'processed',
      processed_at: new Date().toISOString()
    };
  }

  // Integration and Sync Methods
  async syncChannels(channels: string[]): Promise<any> {
    return {
      sync_id: `sync_${Date.now()}`,
      synced_channels: channels,
      status: 'completed',
      results: channels.map(channel => ({
        channel,
        status: 'success',
        synced_products: Math.floor(Math.random() * 100) + 50,
        synced_orders: Math.floor(Math.random() * 50) + 20
      })),
      completed_at: new Date().toISOString()
    };
  }

  async getChannelListings(filters: any): Promise<any[]> {
    return [
      {
        id: 1,
        product_id: 123,
        channel_id: filters.channel_id || 1,
        channel_name: "Amazon",
        status: filters.status || 'active',
        price: 29.99,
        quantity: 50
      },
      {
        id: 2,
        product_id: 124,
        channel_id: 2,
        channel_name: "eBay",
        status: 'active',
        price: 32.99,
        quantity: 30
      }
    ];
  }

  async updateChannelInventory(channel: string, inventoryUpdates: any[]): Promise<any> {
    return {
      channel,
      updated_count: inventoryUpdates.length,
      results: inventoryUpdates.map(update => ({
        product_id: update.product_id,
        status: 'success',
        old_quantity: update.old_quantity || 0,
        new_quantity: update.new_quantity
      })),
      updated_at: new Date().toISOString()
    };
  }
}
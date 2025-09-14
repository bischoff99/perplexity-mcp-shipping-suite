import { z } from 'zod';

/**
 * Veeqo MCP Server Configuration
 */
export interface VeeqoMCPServerConfig {
  name: string;
  version: string;
  apiKey: string;
  apiUrl: string;
  environment: 'development' | 'production' | 'test';
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
  logLevel: string;
  port?: number | undefined;
  webhookPort?: number | undefined;
  webhookSecret?: string | undefined;
  enableWebhooks: boolean;
  redisUrl?: string | undefined;
}

/**
 * Veeqo API Client Configuration
 */
export interface VeeqoClientConfig {
  apiKey: string;
  apiUrl: string;
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
  redisUrl?: string | undefined;
}

/**
 * Custom Veeqo Error
 */
export class VeeqoError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly statusCode?: number | undefined;

  constructor(message: string, code: string = 'VEEQO_ERROR', details?: unknown, statusCode?: number | undefined) {
    super(message);
    this.name = 'VeeqoError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    
    Object.setPrototypeOf(this, VeeqoError.prototype);
  }
}

/**
 * MCP Tool Definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Resource Definition
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  service: string;
  dependencies: Record<string, 'healthy' | 'unhealthy'>;
}

/**
 * Webhook Event Types
 */
export type WebhookEventType = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'status_changed' 
  | 'shipped' 
  | 'cancelled'
  | 'inventory_changed'
  | 'low_stock'
  | 'delivered';

/**
 * Webhook Resource Types
 */
export type WebhookResourceType = 
  | 'Order' 
  | 'Product' 
  | 'Sellable' 
  | 'StockEntry' 
  | 'Customer' 
  | 'Shipment' 
  | 'Allocation';

/**
 * Webhook Payload Structure
 */
export interface VeeqoWebhookPayload {
  event_type: WebhookEventType;
  resource_type: WebhookResourceType;
  resource_id: number;
  data: unknown;
  timestamp?: string;
}

/**
 * Webhook Event for storage
 */
export interface VeeqoWebhookEvent {
  event_type: WebhookEventType;
  resource_type: WebhookResourceType;
  resource_id: number;
  data: unknown;
  timestamp: Date;
}

/**
 * Veeqo Address Interface
 */
export interface VeeqoAddress {
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
}

/**
 * Veeqo Customer Interface
 */
export interface VeeqoCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | undefined;
  marketing_opt_in?: boolean | undefined;
  created_at: string;
  updated_at: string;
  orders_count?: number | undefined;
  lifetime_value?: string | undefined;
  addresses?: VeeqoAddress[] | undefined;
}

/**
 * Veeqo Line Item Interface
 */
export interface VeeqoLineItem {
  id: number;
  sellable_id: number;
  quantity: number;
  price_per_unit: number;
  tax_rate: number;
  taxless_discount_per_unit?: number;
  created_at: string;
  updated_at: string;
  sellable?: VeeqoSellable;
}

/**
 * Veeqo Order Interface
 */
export interface VeeqoOrder {
  id: number;
  number: string;
  status: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  cancelled_at?: string;
  channel_id?: number;
  deliver_to: VeeqoAddress;
  billing_address?: VeeqoAddress;
  customer?: VeeqoCustomer;
  line_items?: VeeqoLineItem[];
  notes?: string;
  customer_notes?: string;
  total_price: number;
  subtotal_price: number;
  delivery_cost: number;
  total_tax: number;
  total_discounts?: number;
  total_fees?: number;
  currency_code?: string;
  international?: boolean;
  receipt_printed?: boolean;
  send_notification_email?: boolean;
  allocations?: VeeqoAllocation[];
  shipments?: VeeqoShipment[];
  payment?: VeeqoPayment;
  tags?: string[];
  due_date?: string;
  dispatch_date?: string;
}

/**
 * Veeqo Stock Entry Interface
 */
export interface VeeqoStockEntry {
  sellable_id: number;
  warehouse_id: number;
  infinite: boolean;
  allocated_stock_level: number;
  physical_stock_level: number;
  available_stock_level: number;
  incoming_stock_level: number;
  sellable_on_hand_value?: number;
  warehouse?: VeeqoWarehouse;
  updated_at: string;
}

/**
 * Veeqo Sellable (Product Variant) Interface
 */
export interface VeeqoSellable {
  id: number;
  type: string;
  title: string;
  sku_code: string;
  upc_code?: string;
  model_number?: string;
  price: number;
  cost_price: number;
  weight_grams: number;
  weight_unit: string;
  dimensions?: VeeqoDimensions;
  min_reorder_level?: number;
  quantity_to_reorder?: number;
  profit?: number;
  margin?: number;
  tax_rate?: number;
  created_at: string;
  updated_at: string;
  product_title?: string;
  full_title?: string;
  sellable_title?: string;
  stock_entries?: VeeqoStockEntry[];
  images?: VeeqoImage[];
  active_channels?: unknown[];
  channel_sellables?: unknown[];
  total_quantity_sold?: number;
  allocated_stock_level_at_all_warehouses?: number;
  available_stock_level_at_all_warehouses?: number;
  stock_level_at_all_warehouses?: number;
  on_hand_value?: number;
}

/**
 * Veeqo Product Interface
 */
export interface VeeqoProduct {
  id: number;
  title: string;
  description?: string;
  product_brand_id?: number;
  estimated_delivery?: string;
  main_image_src?: string;
  created_at: string;
  updated_at: string;
  sellables?: VeeqoSellable[];
  images?: VeeqoImage[];
  tags?: string[];
}

/**
 * Veeqo Warehouse Interface
 */
export interface VeeqoWarehouse {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  region: string;
  country: string;
  post_code: string;
  phone?: string;
  inventory_type_code: string;
  default_min_reorder?: number;
  click_and_collect_enabled: boolean;
  click_and_collect_days?: number;
  location?: string;
  created_at: string;
  updated_at: string;
  display_position?: number;
}

/**
 * Veeqo Shipment Interface
 */
export interface VeeqoShipment {
  id: number;
  order_id: number;
  carrier?: string;
  service?: string;
  tracking_reference?: string;
  label_url?: string;
  tracking_url?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
}

/**
 * Veeqo Allocation Interface
 */
export interface VeeqoAllocation {
  id: number;
  order_id: number;
  warehouse_id: number;
  allocated_by_id?: number;
  total_weight?: number;
  weight_unit?: string;
  packed_completely?: boolean;
  created_at: string;
  updated_at: string;
  line_items?: VeeqoAllocationLineItem[];
}

/**
 * Veeqo Allocation Line Item Interface
 */
export interface VeeqoAllocationLineItem {
  id: number;
  quantity: number;
  picked_quantity: number;
  sellable_id: number;
  created_at: string;
  updated_at: string;
  sellable?: VeeqoSellable;
}

/**
 * Veeqo Payment Interface
 */
export interface VeeqoPayment {
  id?: number;
  payment_type?: string;
  reference_number?: string;
  amount?: number;
  currency_code?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Veeqo User Interface
 */
export interface VeeqoUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  currency_code?: string;
  created_at: string;
  updated_at: string;
  subscription_plan?: VeeqoSubscriptionPlan;
}

/**
 * Veeqo Subscription Plan Interface
 */
export interface VeeqoSubscriptionPlan {
  id: number;
  name: string;
  stripe_plan_id?: string;
  billing_interval?: string;
}

/**
 * Veeqo Store Interface
 */
export interface VeeqoStore {
  id: number;
  name: string;
  url?: string;
  type?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Veeqo Channel Interface
 */
export interface VeeqoChannel {
  id: number;
  name: string;
  type: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Veeqo Image Interface
 */
export interface VeeqoImage {
  id: number;
  src: string;
  product_id?: number;
  sellable_id?: number;
  picture_file_name?: string;
  picture_content_type?: string;
  picture_file_size?: number;
  picture_order?: number;
  display_position?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Veeqo Dimensions Interface
 */
export interface VeeqoDimensions {
  width?: number | undefined;
  height?: number | undefined;
  depth?: number | undefined;
  dimensions_unit?: string | undefined;
}

/**
 * Request Types for API Operations
 */

/**
 * Create Order Request
 */
export interface CreateOrderRequest {
  channel_id?: number | undefined;
  deliver_to: VeeqoAddress;
  billing_address?: VeeqoAddress | undefined;
  customer?: Partial<VeeqoCustomer> | undefined;
  line_items?: Array<{
    sellable_id: number;
    quantity: number;
    price_per_unit?: number | undefined;
    tax_rate?: number | undefined;
  }> | undefined;
  notes?: string | undefined;
  customer_notes?: string | undefined;
  total_price?: number | undefined;
  delivery_cost?: number | undefined;
  tax_rate?: number | undefined;
  status?: string | undefined;
}

/**
 * Create Product Request
 */
export interface CreateProductRequest {
  title: string;
  description?: string | undefined;
  product_brand_id?: number | undefined;
  estimated_delivery?: string | undefined;
  sellables?: Array<{
    title: string;
    sku_code: string;
    price?: number | undefined;
    cost_price?: number | undefined;
    weight_grams?: number | undefined;
    weight_unit?: string | undefined;
    dimensions?: VeeqoDimensions | undefined;
    stock_entries?: Array<{
      warehouse_id: number;
      physical_stock_level?: number | undefined;
      infinite?: boolean | undefined;
    }> | undefined;
  }> | undefined;
}

/**
 * Update Product Request
 */
export interface UpdateProductRequest {
  title?: string | undefined;
  description?: string | undefined;
  product_brand_id?: number | undefined;
  estimated_delivery?: string | undefined;
}

/**
 * Create Customer Request
 */
export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | undefined;
  marketing_opt_in?: boolean | undefined;
}

/**
 * Update Inventory Request
 */
export interface UpdateInventoryRequest {
  sellable_id: number;
  warehouse_id: number;
  physical_stock_level: number;
  infinite?: boolean | undefined;
}

/**
 * Order Search Parameters
 */
export interface OrderSearchParams {
  since_id?: number;
  page?: number;
  page_size?: number;
  status?: string;
  created_at_min?: string;
  updated_at_min?: string;
  query?: string;
  tags?: string;
  allocated_at?: number;
}

/**
 * Product Search Parameters
 */
export interface ProductSearchParams {
  since_id?: number;
  page?: number;
  page_size?: number;
  query?: string;
  created_at_min?: string;
  updated_at_min?: string;
}

/**
 * Environment Variables Schema
 */
export const EnvironmentVariablesSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VEEQO_API_KEY: z.string().min(1, 'Veeqo API key is required'),
  VEEQO_API_URL: z.string().url().default('https://api.veeqo.com'),
  VEEQO_TIMEOUT: z.coerce.number().int().positive().default(30000),
  VEEQO_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(10).default(3),
  ENABLE_CACHE: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PORT: z.coerce.number().int().positive().optional(),
  WEBHOOK_PORT: z.coerce.number().int().positive().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  ENABLE_WEBHOOKS: z.coerce.boolean().default(false),
  REDIS_URL: z.string().optional()
});

export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;

/**
 * Validation Schemas using Zod
 */

/**
 * Address Schema
 */
export const VeeqoAddressSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_line_1: z.string().min(1, 'Address line 1 is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region/state is required'),
  country: z.string().min(2, 'Country code is required').max(3),
  post_code: z.string().min(1, 'Post code is required'),
  phone_number: z.string().optional(),
  email: z.string().email().optional()
});

/**
 * Create Order Schema
 */
export const CreateOrderSchema = z.object({
  channel_id: z.number().int().positive().optional(),
  deliver_to: VeeqoAddressSchema,
  billing_address: VeeqoAddressSchema.optional(),
  customer: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone_number: z.string().optional()
  }).optional(),
  line_items: z.array(z.object({
    sellable_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    price_per_unit: z.number().nonnegative().optional(),
    tax_rate: z.number().nonnegative().max(1).optional()
  })).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  customer_notes: z.string().optional(),
  total_price: z.number().nonnegative().optional(),
  delivery_cost: z.number().nonnegative().optional(),
  tax_rate: z.number().nonnegative().max(1).optional(),
  status: z.string().optional()
});

/**
 * Create Product Schema
 */
export const CreateProductSchema = z.object({
  title: z.string().min(1, 'Product title is required'),
  description: z.string().optional(),
  product_brand_id: z.number().int().positive().optional(),
  estimated_delivery: z.string().optional(),
  sellables: z.array(z.object({
    title: z.string().min(1, 'Sellable title is required'),
    sku_code: z.string().min(1, 'SKU code is required'),
    price: z.number().nonnegative().optional(),
    cost_price: z.number().nonnegative().optional(),
    weight_grams: z.number().nonnegative().optional(),
    weight_unit: z.string().default('g'),
    dimensions: z.object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      depth: z.number().positive().optional(),
      dimensions_unit: z.string().optional()
    }).optional(),
    stock_entries: z.array(z.object({
      warehouse_id: z.number().int().positive(),
      physical_stock_level: z.number().int().nonnegative().optional(),
      infinite: z.boolean().optional()
    })).optional()
  })).optional()
});

/**
 * Update Product Schema
 */
export const UpdateProductSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  product_brand_id: z.number().int().positive().optional(),
  estimated_delivery: z.string().optional()
});

/**
 * Create Customer Schema
 */
export const CreateCustomerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone_number: z.string().optional(),
  marketing_opt_in: z.boolean().optional()
});

/**
 * Update Inventory Schema
 */
export const UpdateInventorySchema = z.object({
  sellable_id: z.number().int().positive(),
  warehouse_id: z.number().int().positive(),
  physical_stock_level: z.number().int().nonnegative(),
  infinite: z.boolean().optional()
});

/**
 * Order Search Schema
 */
export const OrderSearchSchema = z.object({
  since_id: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  created_at_min: z.string().datetime().optional(),
  updated_at_min: z.string().datetime().optional(),
  query: z.string().optional(),
  tags: z.string().optional(),
  allocated_at: z.number().int().positive().optional()
});

/**
 * Product Search Schema
 */
export const ProductSearchSchema = z.object({
  since_id: z.number().int().positive().optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().min(1).max(100).optional(),
  query: z.string().optional(),
  created_at_min: z.string().datetime().optional(),
  updated_at_min: z.string().datetime().optional()
});

/**
 * Warehouse Operation Schema
 */
export const WarehouseOperationSchema = z.object({
  warehouse_id: z.number().int().positive().optional(),
  operation: z.enum(['get', 'update', 'transfer']).optional()
});

/**
 * Response wrapper types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxKeys: number;
  enabled: boolean;
}

/**
 * Logger context interface
 */
export interface LoggerContext {
  requestId?: string | undefined;
  userId?: string | undefined;
  orderId?: number | undefined;
  productId?: number | undefined;
  customerId?: number | undefined;
  operation?: string | undefined;
  duration?: number | undefined;
  [key: string]: unknown;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * Webhook Manager Configuration
 */
export interface WebhookManagerConfig {
  veeqoClient: any; // VeeqoClient type
  secret: string;
  redisUrl?: string | undefined;
  maxRetries?: number | undefined;
  retryDelay?: number | undefined;
}

/**
 * Export all schemas for validation
 */
export const schemas = {
  VeeqoAddressSchema,
  CreateOrderSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateCustomerSchema,
  UpdateInventorySchema,
  OrderSearchSchema,
  ProductSearchSchema,
  WarehouseOperationSchema,
  EnvironmentVariablesSchema
};

/**
 * Constants for Veeqo API
 */
export const CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  MAX_RETRY_DELAY: 30000,
  CACHE_TTL: 300, // 5 minutes
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_BUCKET_SIZE: 100,
  RATE_LIMIT_LEAK_RATE: 5, // per second
  SUPPORTED_COUNTRIES: ['US', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'CA', 'NL'],
  ORDER_STATUSES: [
    'awaiting_payment',
    'awaiting_stock',
    'awaiting_fulfillment',
    'on_hold',
    'shipped',
    'cancelled',
    'refunded',
    'completed'
  ],
  WEIGHT_UNITS: ['g', 'kg', 'oz', 'lb'],
  DIMENSION_UNITS: ['cm', 'm', 'in', 'ft'],
  CURRENCY_CODES: ['USD', 'GBP', 'EUR', 'CAD', 'AUD'],
  RESPONSE_TIMEOUT_MS: 200 // Target response time
} as const;
// Common types for MCP shipping automation platform

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse<T = any> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

// EasyPost Types
export interface EasyPostAddress {
  id?: string;
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface EasyPostParcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface EasyPostShipment {
  id?: string;
  to_address: EasyPostAddress;
  from_address: EasyPostAddress;
  parcel: EasyPostParcel;
  rates?: EasyPostRate[];
  selected_rate?: EasyPostRate;
  tracking_code?: string;
  status?: string;
}

export interface EasyPostRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
}

// Veeqo Types
export interface VeeqoOrder {
  id: number;
  order_number: string;
  channel_id: number;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  currency: string;
  line_items: VeeqoLineItem[];
  delivery_address: VeeqoAddress;
}

export interface VeeqoLineItem {
  id: number;
  quantity: number;
  price_per_unit: number;
  sellable_id: number;
  product_title: string;
  variant_title?: string;
}

export interface VeeqoAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface VeeqoProduct {
  id: number;
  title: string;
  product_brand_id?: number;
  created_at: string;
  updated_at: string;
  sellables: VeeqoSellable[];
}

export interface VeeqoSellable {
  id: number;
  title: string;
  sku_code: string;
  price: number;
  cost_price: number;
  inventory: number;
}

// Dashboard Types
export interface DashboardMetrics {
  totalShipments: number;
  pendingOrders: number;
  inventoryItems: number;
  servicesOnline: number;
  lowStockItems: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'shipment' | 'order' | 'inventory' | 'system';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  responseTime?: number;
}
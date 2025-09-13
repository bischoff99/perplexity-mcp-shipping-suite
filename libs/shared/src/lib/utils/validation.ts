import { z } from 'zod';

// MCP Protocol Schemas
export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any().optional()
});

export const MCPResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional()
  }).optional()
});

// EasyPost Schemas
export const AddressSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const ParcelSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive()
});

export const CreateShipmentSchema = z.object({
  to_address: AddressSchema,
  from_address: AddressSchema,
  parcel: ParcelSchema,
  carrier_accounts: z.array(z.string()).optional(),
  service: z.string().optional()
});

// Veeqo Schemas
export const VeeqoOrderSchema = z.object({
  order_number: z.string(),
  channel_id: z.number(),
  status: z.string(),
  total_price: z.number(),
  currency: z.string(),
  line_items: z.array(z.object({
    quantity: z.number().int().positive(),
    price_per_unit: z.number(),
    sellable_id: z.number(),
    product_title: z.string()
  })),
  delivery_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    phone: z.string().optional()
  })
});

// Dashboard Schemas
export const DashboardMetricsSchema = z.object({
  totalShipments: z.number().int().nonnegative(),
  pendingOrders: z.number().int().nonnegative(),
  inventoryItems: z.number().int().nonnegative(),
  servicesOnline: z.number().int().nonnegative(),
  lowStockItems: z.number().int().nonnegative()
});

// Validation helpers
export function validateMCPRequest(data: unknown) {
  return MCPRequestSchema.parse(data);
}

export function validateMCPResponse(data: unknown) {
  return MCPResponseSchema.parse(data);
}

export function validateAddress(data: unknown) {
  return AddressSchema.parse(data);
}

export function validateParcel(data: unknown) {
  return ParcelSchema.parse(data);
}

export function validateCreateShipment(data: unknown) {
  return CreateShipmentSchema.parse(data);
}

export function validateVeeqoOrder(data: unknown) {
  return VeeqoOrderSchema.parse(data);
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: z.ZodError;
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
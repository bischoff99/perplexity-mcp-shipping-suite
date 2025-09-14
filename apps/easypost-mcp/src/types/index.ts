import { z } from 'zod';

/**
 * EasyPost MCP Server Configuration
 */
export interface EasyPostMCPServerConfig {
  name: string;
  version: string;
  apiKey: string;
  environment: 'development' | 'production' | 'test';
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
  logLevel: string;
  port?: number | undefined;
  baseURL?: string | undefined;
}

/**
 * EasyPost Client Configuration
 */
export interface EasyPostClientConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableCache: boolean;
}

/**
 * Custom EasyPost Error
 */
export class EasyPostError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly statusCode?: number | undefined;

  constructor(message: string, code: string = 'EASYPOST_ERROR', details?: unknown, statusCode?: number) {
    super(message);
    this.name = 'EasyPostError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode ?? undefined;
    
    // Ensure prototype chain is correct
    Object.setPrototypeOf(this, EasyPostError.prototype);
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
 * EasyPost Address Schema and Type
 */
export const EasyPostAddressSchema = z.object({
  id: z.string().optional(),
  object: z.literal('Address').optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().default('US'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  residential: z.boolean().optional(),
  carrier_facility: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  verifications: z.object({
    zip4: z.object({
      success: z.boolean(),
      errors: z.array(z.object({
        code: z.string(),
        field: z.string(),
        message: z.string()
      })).optional(),
      details: z.record(z.string(), z.unknown()).optional()
    }).optional(),
    delivery: z.object({
      success: z.boolean(),
      errors: z.array(z.object({
        code: z.string(),
        field: z.string(),
        message: z.string()
      })).optional(),
      details: z.record(z.string(), z.unknown()).optional()
    }).optional()
  }).optional()
});

export type EasyPostAddress = z.infer<typeof EasyPostAddressSchema>;

/**
 * EasyPost Parcel Schema and Type
 */
export const EasyPostParcelSchema = z.object({
  id: z.string().optional(),
  object: z.literal('Parcel').optional(),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  weight: z.number().positive(),
  predefined_package: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type EasyPostParcel = z.infer<typeof EasyPostParcelSchema>;

/**
 * EasyPost Rate Schema and Type
 */
export const EasyPostRateSchema = z.object({
  id: z.string(),
  object: z.literal('Rate'),
  mode: z.enum(['test', 'production']),
  service: z.string(),
  service_name: z.string(),
  carrier: z.string(),
  carrier_account_id: z.string(),
  shipment_id: z.string(),
  rate: z.string(), // Decimal string
  currency: z.string().default('USD'),
  retail_rate: z.string().optional(),
  retail_currency: z.string().optional(),
  list_rate: z.string().optional(),
  list_currency: z.string().optional(),
  delivery_days: z.number().optional(),
  delivery_date: z.string().optional(),
  delivery_date_guaranteed: z.boolean().optional(),
  est_delivery_days: z.number().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type EasyPostRate = z.infer<typeof EasyPostRateSchema>;

/**
 * EasyPost Postage Label Schema and Type
 */
export const EasyPostPostageLabelSchema = z.object({
  id: z.string(),
  object: z.literal('PostageLabel'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  date_advance: z.number(),
  integrated_form: z.string(),
  label_date: z.string().datetime(),
  label_epl2_url: z.string().url().optional(),
  label_file_type: z.string(),
  label_pdf_url: z.string().url().optional(),
  label_png_url: z.string().url().optional(),
  label_resolution: z.number(),
  label_size: z.string(),
  label_type: z.string(),
  label_url: z.string().url(),
  label_zpl_url: z.string().url().optional()
});

export type EasyPostPostageLabel = z.infer<typeof EasyPostPostageLabelSchema>;

/**
 * EasyPost Shipment Schema and Type
 */
export const EasyPostShipmentSchema = z.object({
  id: z.string(),
  object: z.literal('Shipment'),
  mode: z.enum(['test', 'production']),
  to_address: EasyPostAddressSchema,
  from_address: EasyPostAddressSchema,
  return_address: EasyPostAddressSchema.optional(),
  buyer_address: EasyPostAddressSchema.optional(),
  parcel: EasyPostParcelSchema,
  customs_info: z.object({
    id: z.string(),
    object: z.literal('CustomsInfo'),
    contents_type: z.string(),
    contents_explanation: z.string().optional(),
    customs_certify: z.boolean(),
    customs_signer: z.string(),
    non_delivery_option: z.string(),
    restriction_type: z.string().optional(),
    restriction_comments: z.string().optional(),
    customs_items: z.array(z.object({
      id: z.string(),
      object: z.literal('CustomsItem'),
      description: z.string(),
      quantity: z.number().int().positive(),
      weight: z.number().positive(),
      value: z.string(), // Decimal string
      hs_tariff_number: z.string().optional(),
      origin_country: z.string(),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime()
    })),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime()
  }).optional(),
  service: z.string().optional(),
  carrier: z.string().optional(),
  tracking_code: z.string().optional(),
  status: z.string().optional(),
  refund_status: z.string().optional(),
  scan_form: z.string().optional(),
  selected_rate: EasyPostRateSchema.optional(),
  rates: z.array(EasyPostRateSchema).optional(),
  postage_label: EasyPostPostageLabelSchema.optional(),
  forms: z.array(z.record(z.string(), z.unknown())).optional(),
  fees: z.array(z.object({
    object: z.string(),
    type: z.string(),
    amount: z.string(),
    charged: z.boolean(),
    refunded: z.boolean()
  })).optional(),
  insurance: z.string().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  messages: z.array(z.object({
    carrier: z.string(),
    carrier_account_id: z.string(),
    type: z.string(),
    message: z.string()
  })).optional(),
  reference: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type EasyPostShipment = z.infer<typeof EasyPostShipmentSchema>;

/**
 * EasyPost Tracker Schema and Type
 */
export const EasyPostTrackerSchema = z.object({
  id: z.string(),
  object: z.literal('Tracker'),
  mode: z.enum(['test', 'production']),
  tracking_code: z.string(),
  status: z.string().optional(),
  status_detail: z.string().optional(),
  carrier: z.string(),
  carrier_detail: z.object({
    object: z.string(),
    service: z.string(),
    container_type: z.string().optional(),
    est_delivery_date_local: z.string().optional(),
    est_delivery_time_local: z.string().optional(),
    origin_location: z.string().optional(),
    destination_location: z.string().optional(),
    guaranteed_delivery_date: z.string().optional(),
    alternate_identifier: z.string().optional(),
    initial_delivery_attempt: z.string().optional()
  }).optional(),
  tracking_details: z.array(z.object({
    object: z.string(),
    message: z.string(),
    description: z.string().optional(),
    status: z.string(),
    status_detail: z.string().optional(),
    datetime: z.string().datetime(),
    source: z.string(),
    carrier_code: z.string().optional(),
    tracking_location: z.object({
      object: z.string(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional()
    }).optional()
  })),
  fees: z.array(z.object({
    object: z.string(),
    type: z.string(),
    amount: z.string(),
    charged: z.boolean(),
    refunded: z.boolean()
  })).optional(),
  est_delivery_date: z.string().optional(),
  shipment_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type EasyPostTracker = z.infer<typeof EasyPostTrackerSchema>;

/**
 * EasyPost Account Schema and Type
 */
export const EasyPostAccountSchema = z.object({
  id: z.string(),
  object: z.literal('Account'),
  parent_id: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string().optional(),
  balance: z.string(), // Decimal string
  price_per_shipment: z.string(), // Decimal string
  recharge_amount: z.string().optional(),
  secondary_recharge_amount: z.string().optional(),
  recharge_threshold: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  verified: z.boolean().optional(),
  cc_fee_rate: z.string().optional(),
  insurance_fee_rate: z.string().optional(),
  insurance_fee_minimum: z.string().optional(),
  default_carbon_offset: z.boolean().optional(),
  api_keys: z.array(z.object({
    object: z.string(),
    key: z.string(),
    mode: z.enum(['test', 'production']),
    created_at: z.string().datetime(),
    active: z.boolean(),
    id: z.string()
  })).optional()
});

export type EasyPostAccount = z.infer<typeof EasyPostAccountSchema>;

/**
 * EasyPost Carrier Schema and Type
 */
export const EasyPostCarrierSchema = z.object({
  object: z.string(),
  type: z.string(),
  readable: z.string(),
  logo: z.string().url().optional(),
  fields: z.record(z.string(), z.object({
    visibility: z.string(),
    label: z.string(),
    value: z.string().optional()
  })).optional()
});

export type EasyPostCarrier = z.infer<typeof EasyPostCarrierSchema>;

/**
 * Request Types
 */

// Create Shipment Request
export const CreateShipmentRequestSchema = z.object({
  to_address: EasyPostAddressSchema.omit({ id: true, object: true, created_at: true, updated_at: true, verifications: true }),
  from_address: EasyPostAddressSchema.omit({ id: true, object: true, created_at: true, updated_at: true, verifications: true }),
  return_address: EasyPostAddressSchema.omit({ id: true, object: true, created_at: true, updated_at: true, verifications: true }).optional(),
  parcel: EasyPostParcelSchema.omit({ id: true, object: true, created_at: true, updated_at: true }),
  options: z.record(z.string(), z.unknown()).optional(),
  customs_info: z.object({
    contents_type: z.string(),
    contents_explanation: z.string().optional(),
    customs_certify: z.boolean(),
    customs_signer: z.string(),
    non_delivery_option: z.string(),
    restriction_type: z.string().optional(),
    restriction_comments: z.string().optional(),
    customs_items: z.array(z.object({
      description: z.string(),
      quantity: z.number().int().positive(),
      weight: z.number().positive(),
      value: z.number().positive(),
      hs_tariff_number: z.string().optional(),
      origin_country: z.string()
    }))
  }).optional()
});

export type CreateShipmentRequest = z.infer<typeof CreateShipmentRequestSchema>;

// Address Validation Request
export const AddressValidationRequestSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  street1: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().default('US'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  residential: z.boolean().optional()
});

export type AddressValidationRequest = z.infer<typeof AddressValidationRequestSchema>;

// Shipment Rates Fetch Request
export const ShipmentRatesFetchRequestSchema = z.object({
  shipmentId: z.string()
});

export type ShipmentRatesFetchRequest = z.infer<typeof ShipmentRatesFetchRequestSchema>;

// Shipment Label Purchase Request
export const ShipmentLabelPurchaseRequestSchema = z.object({
  shipmentId: z.string(),
  rateId: z.string(),
  insurance: z.string().optional()
});

export type ShipmentLabelPurchaseRequest = z.infer<typeof ShipmentLabelPurchaseRequestSchema>;

// Shipment Tracking Request
export const ShipmentTrackingRequestSchema = z.object({
  trackingCode: z.string(),
  carrier: z.string().optional()
});

export type ShipmentTrackingRequest = z.infer<typeof ShipmentTrackingRequestSchema>;

// SmartRate Request
export const SmartrateRequestSchema = z.object({
  from_zip: z.string(),
  to_zip: z.string(),
  carriers: z.array(z.string()).optional(),
  planned_ship_date: z.string().optional(),
  desired_delivery_date: z.string().optional()
});

export type SmartrateRequest = z.infer<typeof SmartrateRequestSchema>;

/**
 * Environment Variables Schema
 */
export const EnvironmentVariablesSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  EASYPOST_API_KEY: z.string().min(1, 'EasyPost API key is required'),
  EASYPOST_TIMEOUT: z.coerce.number().int().positive().default(30000),
  EASYPOST_RETRY_ATTEMPTS: z.coerce.number().int().min(0).max(5).default(3),
  ENABLE_CACHE: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PORT: z.coerce.number().int().positive().optional()
});

export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;

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
  shipmentId?: string | undefined;
  trackingCode?: string | undefined;
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
 * Export all schemas for validation
 */
export const schemas = {
  EasyPostAddressSchema,
  EasyPostParcelSchema,
  EasyPostRateSchema,
  EasyPostPostageLabelSchema,
  EasyPostShipmentSchema,
  EasyPostTrackerSchema,
  EasyPostAccountSchema,
  EasyPostCarrierSchema,
  CreateShipmentRequestSchema,
  AddressValidationRequestSchema,
  ShipmentRatesFetchRequestSchema,
  ShipmentLabelPurchaseRequestSchema,
  ShipmentTrackingRequestSchema,
  SmartrateRequestSchema,
  EnvironmentVariablesSchema
};

/**
 * Common constants
 */
export const CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRY_ATTEMPTS: 3,
  MAX_RETRY_DELAY: 30000,
  CACHE_TTL: 300, // 5 minutes
  SUPPORTED_CARRIERS: ['USPS', 'UPS', 'FedEx', 'DHL', 'CanadaPost', 'AusPost'],
  SUPPORTED_COUNTRIES: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
  RESPONSE_TIMEOUT_MS: 200, // Target response time
} as const;
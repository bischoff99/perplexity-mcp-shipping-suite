import { z } from 'zod';
import {
  EnvironmentVariablesSchema,
  CreateOrderSchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateCustomerSchema,
  UpdateInventorySchema,
  OrderSearchSchema,
  ProductSearchSchema,
  WarehouseOperationSchema,
  type EnvironmentVariables,
  type CreateOrderRequest,
  type CreateProductRequest,
  type UpdateProductRequest,
  type CreateCustomerRequest,
  type UpdateInventoryRequest,
  type OrderSearchParams,
  type ProductSearchParams
} from '../types/index.js';
import { logger } from './logger.js';

/**
 * Validation utilities for Veeqo MCP Server
 * Provides comprehensive input validation using Zod schemas with Veeqo-specific business rules
 */

/**
 * Validate environment variables
 */
export function validateEnvironmentVariables(): z.SafeParseReturnType<Record<string, unknown>, EnvironmentVariables> {
  const envVars = {
    NODE_ENV: process.env['NODE_ENV'],
    VEEQO_API_KEY: process.env['VEEQO_API_KEY'],
    VEEQO_API_URL: process.env['VEEQO_API_URL'] || 'https://api.veeqo.com',
    VEEQO_TIMEOUT: process.env['VEEQO_TIMEOUT'],
    VEEQO_RETRY_ATTEMPTS: process.env['VEEQO_RETRY_ATTEMPTS'],
    ENABLE_CACHE: process.env['ENABLE_CACHE'],
    LOG_LEVEL: process.env['LOG_LEVEL'],
    PORT: process.env['PORT'],
    WEBHOOK_PORT: process.env['WEBHOOK_PORT'],
    WEBHOOK_SECRET: process.env['WEBHOOK_SECRET'],
    ENABLE_WEBHOOKS: process.env['ENABLE_WEBHOOKS'],
    REDIS_URL: process.env['REDIS_URL']
  };

  const result = EnvironmentVariablesSchema.safeParse(envVars);
  
  if (!result.success) {
    logger.error('Environment variable validation failed', {
      errors: result.error.errors
    });
  } else {
    // Additional validation for Veeqo-specific requirements
    if (result.data.VEEQO_API_KEY && !validateVeeqoApiKey(result.data.VEEQO_API_KEY)) {
      logger.error('Invalid Veeqo API key format');
      return {
        success: false,
        error: z.ZodError.create([{
          code: 'custom',
          path: ['VEEQO_API_KEY'],
          message: 'Invalid Veeqo API key format'
        }])
      } as z.SafeParseReturnType<Record<string, unknown>, EnvironmentVariables>;
    }
  }

  return result;
}

/**
 * Validate order creation request
 */
export function validateOrderCreation(data: unknown): z.SafeParseReturnType<unknown, CreateOrderRequest> {
  const result = CreateOrderSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Order creation validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
    return result;
  }

  // Additional business rule validations
  const businessValidation = validateOrderBusinessRules(result.data);
  if (!businessValidation.isValid) {
    logger.warn('Order business rules validation failed', {
      errors: businessValidation.errors,
      data: sanitizeLogData(data)
    });
    
    return {
      success: false,
      error: z.ZodError.create(businessValidation.errors.map(err => ({
        code: 'custom',
        path: [],
        message: err
      })))
    } as z.SafeParseReturnType<unknown, CreateOrderRequest>;
  }

  return result;
}

/**
 * Validate product creation request
 */
export function validateProductCreation(data: unknown): z.SafeParseReturnType<unknown, CreateProductRequest> {
  const result = CreateProductSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Product creation validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
    return result;
  }

  // Additional business rule validations
  const businessValidation = validateProductBusinessRules(result.data);
  if (!businessValidation.isValid) {
    logger.warn('Product business rules validation failed', {
      errors: businessValidation.errors,
      data: sanitizeLogData(data)
    });
    
    return {
      success: false,
      error: z.ZodError.create(businessValidation.errors.map(err => ({
        code: 'custom',
        path: [],
        message: err
      })))
    } as z.SafeParseReturnType<unknown, CreateProductRequest>;
  }

  return result;
}

/**
 * Validate product update request
 */
export function validateProductUpdate(data: unknown): z.SafeParseReturnType<unknown, UpdateProductRequest & { productId: number }> {
  const result = UpdateProductSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Product update validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate customer creation request
 */
export function validateCustomerCreation(data: unknown): z.SafeParseReturnType<unknown, CreateCustomerRequest> {
  const result = CreateCustomerSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Customer creation validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
    return result;
  }

  // Additional business rule validations
  const businessValidation = validateCustomerBusinessRules(result.data);
  if (!businessValidation.isValid) {
    logger.warn('Customer business rules validation failed', {
      errors: businessValidation.errors,
      data: sanitizeLogData(data)
    });
    
    return {
      success: false,
      error: z.ZodError.create(businessValidation.errors.map(err => ({
        code: 'custom',
        path: [],
        message: err
      })))
    } as z.SafeParseReturnType<unknown, CreateCustomerRequest>;
  }

  return result;
}

/**
 * Validate inventory update request
 */
export function validateInventoryUpdate(data: unknown): z.SafeParseReturnType<unknown, UpdateInventoryRequest> {
  const result = UpdateInventorySchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Inventory update validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
    return result;
  }

  // Additional business rule validations
  const businessValidation = validateInventoryBusinessRules(result.data);
  if (!businessValidation.isValid) {
    logger.warn('Inventory business rules validation failed', {
      errors: businessValidation.errors,
      data: sanitizeLogData(data)
    });
    
    return {
      success: false,
      error: z.ZodError.create(businessValidation.errors.map(err => ({
        code: 'custom',
        path: [],
        message: err
      })))
    } as z.SafeParseReturnType<unknown, UpdateInventoryRequest>;
  }

  return result;
}

/**
 * Validate order search parameters
 */
export function validateOrderSearch(data: unknown): z.SafeParseReturnType<unknown, OrderSearchParams> {
  const result = OrderSearchSchema.safeParse(data) as z.SafeParseReturnType<unknown, OrderSearchParams>;
  
  if (!result.success) {
    logger.warn('Order search validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate product search parameters
 */
export function validateProductSearch(data: unknown): z.SafeParseReturnType<unknown, ProductSearchParams> {
  const result = ProductSearchSchema.safeParse(data) as z.SafeParseReturnType<unknown, ProductSearchParams>;
  
  if (!result.success) {
    logger.warn('Product search validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate warehouse operation
 */
export function validateWarehouseOperation(data: unknown): z.SafeParseReturnType<unknown, { warehouse_id?: number; operation?: string }> {
  const result = WarehouseOperationSchema.safeParse(data) as z.SafeParseReturnType<unknown, { warehouse_id?: number; operation?: string }>;
  
  if (!result.success) {
    logger.warn('Warehouse operation validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * BUSINESS RULE VALIDATIONS
 */

/**
 * Validate order business rules
 */
function validateOrderBusinessRules(order: CreateOrderRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate delivery address completeness
  if (!validateAddress(order.deliver_to)) {
    errors.push('Delivery address is incomplete or invalid');
  }

  // Validate billing address if provided
  if (order.billing_address && !validateAddress(order.billing_address)) {
    errors.push('Billing address is incomplete or invalid');
  }

  // Validate line items
  if (order.line_items && order.line_items.length > 0) {
    order.line_items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: Quantity must be positive`);
      }
      if (item.price_per_unit !== undefined && item.price_per_unit < 0) {
        errors.push(`Line item ${index + 1}: Price cannot be negative`);
      }
      if (item.tax_rate !== undefined && (item.tax_rate < 0 || item.tax_rate > 1)) {
        errors.push(`Line item ${index + 1}: Tax rate must be between 0 and 1`);
      }
    });
  }

  // Validate total price consistency
  if (order.total_price !== undefined && order.total_price < 0) {
    errors.push('Total price cannot be negative');
  }

  // Validate delivery cost
  if (order.delivery_cost !== undefined && order.delivery_cost < 0) {
    errors.push('Delivery cost cannot be negative');
  }

  // Validate customer email if provided
  if (order.customer?.email && !validateEmail(order.customer.email)) {
    errors.push('Customer email is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate product business rules
 */
function validateProductBusinessRules(product: CreateProductRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate product title length
  if (product.title.length > 255) {
    errors.push('Product title cannot exceed 255 characters');
  }

  // Validate description length
  if (product.description && product.description.length > 5000) {
    errors.push('Product description cannot exceed 5000 characters');
  }

  // Validate sellables if provided
  if (product.sellables && product.sellables.length > 0) {
    const skuCodes = new Set<string>();
    
    product.sellables.forEach((sellable, index) => {
      // Check for duplicate SKU codes
      if (skuCodes.has(sellable.sku_code)) {
        errors.push(`Sellable ${index + 1}: Duplicate SKU code '${sellable.sku_code}'`);
      } else {
        skuCodes.add(sellable.sku_code);
      }

      // Validate SKU code format
      if (!validateSkuCode(sellable.sku_code)) {
        errors.push(`Sellable ${index + 1}: Invalid SKU code format`);
      }

      // Validate price
      if (sellable.price !== undefined && sellable.price < 0) {
        errors.push(`Sellable ${index + 1}: Price cannot be negative`);
      }

      // Validate cost price
      if (sellable.cost_price !== undefined && sellable.cost_price < 0) {
        errors.push(`Sellable ${index + 1}: Cost price cannot be negative`);
      }

      // Validate weight
      if (sellable.weight_grams !== undefined) {
        if (sellable.weight_grams < 0) {
          errors.push(`Sellable ${index + 1}: Weight cannot be negative`);
        }
        if (sellable.weight_grams > 100000) { // 100kg max
          errors.push(`Sellable ${index + 1}: Weight cannot exceed 100kg`);
        }
      }

      // Validate dimensions
      if (sellable.dimensions) {
        const { width, height, depth } = sellable.dimensions;
        if (width !== undefined && (width <= 0 || width > 1000)) {
          errors.push(`Sellable ${index + 1}: Width must be between 0 and 1000cm`);
        }
        if (height !== undefined && (height <= 0 || height > 1000)) {
          errors.push(`Sellable ${index + 1}: Height must be between 0 and 1000cm`);
        }
        if (depth !== undefined && (depth <= 0 || depth > 1000)) {
          errors.push(`Sellable ${index + 1}: Depth must be between 0 and 1000cm`);
        }
      }

      // Validate stock entries
      if (sellable.stock_entries && sellable.stock_entries.length > 0) {
        sellable.stock_entries.forEach((entry, entryIndex) => {
          if (entry.physical_stock_level !== undefined && entry.physical_stock_level < 0) {
            errors.push(`Sellable ${index + 1}, Stock entry ${entryIndex + 1}: Stock level cannot be negative`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate customer business rules
 */
function validateCustomerBusinessRules(customer: CreateCustomerRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate name lengths
  if (customer.first_name.length > 50) {
    errors.push('First name cannot exceed 50 characters');
  }
  if (customer.last_name.length > 50) {
    errors.push('Last name cannot exceed 50 characters');
  }

  // Validate phone number format if provided
  if (customer.phone_number && !validatePhoneNumber(customer.phone_number)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate inventory business rules
 */
function validateInventoryBusinessRules(inventory: UpdateInventoryRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate stock level limits
  if (inventory.physical_stock_level > 1000000) {
    errors.push('Stock level cannot exceed 1,000,000 units');
  }

  // Cannot have both infinite and physical stock level > 0 in some cases
  if (inventory.infinite === true && inventory.physical_stock_level > 0) {
    logger.warn('Setting infinite stock with physical stock level', {
      sellable_id: inventory.sellable_id,
      warehouse_id: inventory.warehouse_id,
      physical_stock_level: inventory.physical_stock_level
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * UTILITY VALIDATION FUNCTIONS
 */

/**
 * Validate Veeqo API key format
 */
export function validateVeeqoApiKey(apiKey: string): boolean {
  // Veeqo API keys are typically long alphanumeric strings
  // Basic validation: should be at least 32 characters, alphanumeric + some special chars
  const apiKeyRegex = /^[A-Za-z0-9_/-]{32,}$/;
  
  if (!apiKeyRegex.test(apiKey)) {
    logger.error('Invalid Veeqo API key format', {
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 4)
    });
    return false;
  }

  return true;
}

/**
 * Validate address completeness
 */
function validateAddress(address: {
  address_line_1: string;
  city: string;
  region: string;
  country: string;
  post_code: string;
}): boolean {
  // Check required fields are not empty
  if (!address.address_line_1.trim()) return false;
  if (!address.city.trim()) return false;
  if (!address.region.trim()) return false;
  if (!address.country.trim()) return false;
  if (!address.post_code.trim()) return false;

  // Validate country code
  if (!validateCountryCode(address.country)) return false;

  // Validate postal code format based on country
  if (!validatePostalCode(address.post_code, address.country)) return false;

  return true;
}

/**
 * Validate country code (ISO 3166-1 alpha-2/3)
 */
function validateCountryCode(countryCode: string): boolean {
  // Common country codes supported by Veeqo
  const supportedCountries = [
    'US', 'USA', 'CA', 'CAN', 'GB', 'GBR', 'AU', 'AUS', 'DE', 'DEU',
    'FR', 'FRA', 'IT', 'ITA', 'ES', 'ESP', 'NL', 'NLD', 'BE', 'BEL',
    'CH', 'CHE', 'AT', 'AUT', 'IE', 'IRL', 'PT', 'PRT', 'SE', 'SWE',
    'DK', 'DNK', 'NO', 'NOR', 'FI', 'FIN', 'PL', 'POL', 'CZ', 'CZE',
    'HU', 'HUN', 'SK', 'SVK', 'SI', 'SVN', 'HR', 'HRV', 'RO', 'ROU',
    'BG', 'BGR', 'GR', 'GRC', 'MT', 'MLT', 'CY', 'CYP', 'EE', 'EST',
    'LV', 'LVA', 'LT', 'LTU', 'LU', 'LUX'
  ];

  return supportedCountries.includes(countryCode.toUpperCase());
}

/**
 * Validate postal code format based on country
 */
function validatePostalCode(postalCode: string, country: string): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/, // 12345 or 12345-6789
    USA: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, // K1A 0A6 or K1A-0A6
    CAN: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
    GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, // SW1A 1AA
    GBR: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/,
    AU: /^\d{4}$/, // 2000
    AUS: /^\d{4}$/,
    DE: /^\d{5}$/, // 12345
    DEU: /^\d{5}$/,
    FR: /^\d{5}$/, // 75001
    FRA: /^\d{5}$/,
    IT: /^\d{5}$/, // 00118
    ITA: /^\d{5}$/,
    ES: /^\d{5}$/, // 28001
    ESP: /^\d{5}$/,
    NL: /^\d{4}\s?[A-Za-z]{2}$/, // 1234 AB
    NLD: /^\d{4}\s?[A-Za-z]{2}$/
  };

  const pattern = patterns[country.toUpperCase()];
  if (!pattern) {
    logger.warn('Postal code validation: unsupported country', { country, postalCode });
    return true; // Allow unknown countries
  }

  const isValid = pattern.test(postalCode);
  if (!isValid) {
    logger.warn('Invalid postal code format', { country, postalCode });
  }

  return isValid;
}

/**
 * Validate email address format
 */
function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);
  
  if (!result.success) {
    logger.warn('Invalid email format', { email: maskEmail(email) });
  }

  return result.success;
}

/**
 * Validate phone number format (international)
 */
function validatePhoneNumber(phoneNumber: string): boolean {
  // Basic international phone number validation
  // Allows +, digits, spaces, dashes, parentheses, and dots
  const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;
  
  const isValid = phoneRegex.test(phoneNumber);
  if (!isValid) {
    logger.warn('Invalid phone number format', { phoneNumber: maskPhoneNumber(phoneNumber) });
  }

  return isValid;
}

/**
 * Validate SKU code format
 */
function validateSkuCode(skuCode: string): boolean {
  // SKU codes should be alphanumeric with hyphens and underscores allowed
  // Length between 1-50 characters
  const skuRegex = /^[A-Za-z0-9_-]{1,50}$/;
  
  const isValid = skuRegex.test(skuCode);
  if (!isValid) {
    logger.warn('Invalid SKU code format', { skuCode });
  }

  return isValid;
}

/**
 * Validate currency amount format
 */
export function validateCurrencyAmount(amount: string): boolean {
  const currencyRegex = /^\d+(\.\d{1,2})?$/;
  const isValid = currencyRegex.test(amount) && parseFloat(amount) >= 0;
  
  if (!isValid) {
    logger.warn('Invalid currency amount format', { amount });
  }

  return isValid;
}

/**
 * Validate date string (ISO format)
 */
export function validateDateString(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  
  if (!isoDateRegex.test(dateString)) {
    logger.warn('Invalid date string format', { dateString });
    return false;
  }

  const date = new Date(dateString);
  const isValid = !isNaN(date.getTime());
  
  if (!isValid) {
    logger.warn('Invalid date value', { dateString });
  }

  return isValid;
}

/**
 * Validate JSON string
 */
export function validateJsonString(jsonString: string): { isValid: boolean; parsed?: unknown; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    return { isValid: true, parsed };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown JSON parse error';
    logger.warn('Invalid JSON string', { error: errorMessage });
    return { isValid: false, error: errorMessage };
  }
}

/**
 * DATA SANITIZATION UTILITIES
 */

/**
 * Sanitize data for logging (remove sensitive information)
 */
function sanitizeLogData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };
  
  // Remove or mask sensitive fields
  const sensitiveFields = [
    'api_key', 'apiKey', 'password', 'token', 'secret', 'key',
    'authorization', 'auth', 'webhook_secret'
  ];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Mask email addresses
  if ('email' in sanitized && typeof sanitized['email'] === 'string') {
    sanitized['email'] = maskEmail(sanitized['email']);
  }

  // Mask phone numbers
  if ('phone' in sanitized && typeof sanitized['phone'] === 'string') {
    sanitized['phone'] = maskPhoneNumber(sanitized['phone']);
  }
  if ('phone_number' in sanitized && typeof sanitized['phone_number'] === 'string') {
    sanitized['phone_number'] = maskPhoneNumber(sanitized['phone_number']);
  }

  return sanitized;
}

/**
 * Mask email address for logging
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || !localPart) return email;

  const maskedLocal = localPart.length > 2
    ? localPart.substring(0, 2) + '*'.repeat(Math.max(0, localPart.length - 2))
    : localPart;
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone;
  
  const start = Math.min(3, phone.length - 3);
  const end = Math.max(start, phone.length - 3);
  
  return phone.substring(0, start) + 
         '*'.repeat(Math.max(0, end - start)) + 
         phone.substring(end);
}

/**
 * Comprehensive request validation wrapper
 */
export function validateRequestComprehensive<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string
): { isValid: boolean; data?: T; errors?: string[]; warnings?: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, data: result.data };
  }

  const errors = result.error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  );

  logger.error(`Validation failed for ${context}`, {
    errors,
    data: sanitizeLogData(data)
  });

  return { isValid: false, errors };
}

/**
 * Export all validators
 */
export const validators = {
  validateEnvironmentVariables,
  validateOrderCreation,
  validateProductCreation,
  validateProductUpdate,
  validateCustomerCreation,
  validateInventoryUpdate,
  validateOrderSearch,
  validateProductSearch,
  validateWarehouseOperation,
  validateVeeqoApiKey,
  validateCurrencyAmount,
  validateDateString,
  validateJsonString,
  validateRequestComprehensive
};
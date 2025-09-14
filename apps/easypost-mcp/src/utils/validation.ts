import { z } from 'zod';
import {
  EnvironmentVariablesSchema,
  CreateShipmentRequestSchema,
  AddressValidationRequestSchema,
  ShipmentRatesFetchRequestSchema,
  ShipmentLabelPurchaseRequestSchema,
  ShipmentTrackingRequestSchema,
  SmartrateRequestSchema,
  type EnvironmentVariables,
  type CreateShipmentRequest,
  type AddressValidationRequest,
  type ShipmentRatesFetchRequest,
  type ShipmentLabelPurchaseRequest,
  type ShipmentTrackingRequest,
  type SmartrateRequest
} from '../types/index.js';
import { logger } from './logger.js';

/**
 * Validation utilities for EasyPost MCP Server
 * Provides comprehensive input validation using Zod schemas
 */

/**
 * Validate environment variables
 */
export function validateEnvironmentVariables(): z.SafeParseReturnType<Record<string, unknown>, EnvironmentVariables> {
  const envVars = {
    NODE_ENV: process.env['NODE_ENV'],
    EASYPOST_API_KEY: process.env['EASYPOST_API_KEY'],
    EASYPOST_TIMEOUT: process.env['EASYPOST_TIMEOUT'],
    EASYPOST_RETRY_ATTEMPTS: process.env['EASYPOST_RETRY_ATTEMPTS'],
    ENABLE_CACHE: process.env['ENABLE_CACHE'],
    LOG_LEVEL: process.env['LOG_LEVEL'],
    PORT: process.env['PORT']
  };

  const result = EnvironmentVariablesSchema.safeParse(envVars);
  
  if (!result.success) {
    logger.error('Environment variable validation failed', {
      errors: result.error.errors
    });
  }

  return result;
}

/**
 * Validate shipment creation request
 */
export function validateShipmentCreation(data: unknown): z.SafeParseReturnType<unknown, CreateShipmentRequest> {
  const result = CreateShipmentRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Shipment creation validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate address verification request
 */
export function validateAddressVerification(data: unknown): z.SafeParseReturnType<unknown, AddressValidationRequest> {
  const result = AddressValidationRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Address validation request validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate shipment rates fetch request
 */
export function validateShipmentRatesFetch(data: unknown): z.SafeParseReturnType<unknown, ShipmentRatesFetchRequest> {
  const result = ShipmentRatesFetchRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Shipment rates fetch validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate shipment label purchase request
 */
export function validateShipmentLabelPurchase(data: unknown): z.SafeParseReturnType<unknown, ShipmentLabelPurchaseRequest> {
  const result = ShipmentLabelPurchaseRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Shipment label purchase validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate shipment tracking request
 */
export function validateShipmentTracking(data: unknown): z.SafeParseReturnType<unknown, ShipmentTrackingRequest> {
  const result = ShipmentTrackingRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('Shipment tracking validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate SmartRate request
 */
export function validateSmartrateRequest(data: unknown): z.SafeParseReturnType<unknown, SmartrateRequest> {
  const result = SmartrateRequestSchema.safeParse(data);
  
  if (!result.success) {
    logger.warn('SmartRate request validation failed', {
      errors: result.error.errors,
      data: sanitizeLogData(data)
    });
  }

  return result;
}

/**
 * Validate EasyPost API key format
 */
export function validateEasyPostApiKey(apiKey: string): boolean {
  // EasyPost API keys start with 'EZAK' for live keys or 'EZAK' for test keys
  // Format: EZAK[test|prod]_[alphanumeric string]
  const apiKeyRegex = /^EZ[AT]K[a-zA-Z0-9_-]+$/;
  
  if (!apiKeyRegex.test(apiKey)) {
    logger.error('Invalid EasyPost API key format', {
      keyPrefix: apiKey.substring(0, 4),
      keyLength: apiKey.length
    });
    return false;
  }

  return true;
}

/**
 * Validate postal/zip code format
 */
export function validatePostalCode(postalCode: string, country: string = 'US'): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/, // 12345 or 12345-6789
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, // K1A 0A6 or K1A-0A6
    GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, // SW1A 1AA
    AU: /^\d{4}$/, // 2000
    DE: /^\d{5}$/, // 12345
    FR: /^\d{5}$/, // 75001
    IT: /^\d{5}$/, // 00118
    ES: /^\d{5}$/, // 28001
    NL: /^\d{4}\s?[A-Za-z]{2}$/ // 1234 AB
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
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Basic phone number validation - allows various international formats
  const phoneRegex = /^\+?[\d\s\-\(\)\.]{10,20}$/;
  
  const isValid = phoneRegex.test(phoneNumber);
  if (!isValid) {
    logger.warn('Invalid phone number format', { phoneNumber: maskPhoneNumber(phoneNumber) });
  }

  return isValid;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(email);
  
  if (!result.success) {
    logger.warn('Invalid email format', { email: maskEmail(email) });
  }

  return result.success;
}

/**
 * Validate weight and dimensions
 */
export function validateParcelDimensions(dimensions: {
  length: number;
  width: number;
  height: number;
  weight: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check positive values
  if (dimensions.length <= 0) errors.push('Length must be positive');
  if (dimensions.width <= 0) errors.push('Width must be positive');
  if (dimensions.height <= 0) errors.push('Height must be positive');
  if (dimensions.weight <= 0) errors.push('Weight must be positive');

  // Check reasonable maximums (in inches and pounds)
  if (dimensions.length > 108) errors.push('Length cannot exceed 108 inches');
  if (dimensions.width > 108) errors.push('Width cannot exceed 108 inches');
  if (dimensions.height > 108) errors.push('Height cannot exceed 108 inches');
  if (dimensions.weight > 150) errors.push('Weight cannot exceed 150 pounds');

  // Check volume (cubic inches)
  const volume = dimensions.length * dimensions.width * dimensions.height;
  if (volume > 1728000) { // ~1000 cubic feet
    errors.push('Package volume is too large');
  }

  if (errors.length > 0) {
    logger.warn('Invalid parcel dimensions', { dimensions, errors });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate currency amount (as string for precision)
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
 * Validate country code (ISO 3166-1 alpha-2)
 */
export function validateCountryCode(countryCode: string): boolean {
  // Common country codes supported by EasyPost
  const supportedCountries = [
    'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
    'CH', 'AT', 'IE', 'PT', 'SE', 'DK', 'NO', 'FI', 'PL', 'CZ',
    'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'EE', 'LV', 'LT', 'LU',
    'MT', 'CY', 'JP', 'KR', 'CN', 'HK', 'SG', 'MY', 'TH', 'ID',
    'PH', 'VN', 'IN', 'PK', 'BD', 'LK', 'NP', 'MX', 'BR', 'AR',
    'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR',
    'GF', 'ZA', 'NG', 'KE', 'GH', 'MA', 'EG', 'IL', 'AE', 'SA',
    'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'TR', 'GR', 'RU', 'UA'
  ];

  const isValid = supportedCountries.includes(countryCode.toUpperCase());
  
  if (!isValid) {
    logger.warn('Unsupported country code', { countryCode });
  }

  return isValid;
}

/**
 * Validate carrier name
 */
export function validateCarrier(carrier: string): boolean {
  const supportedCarriers = [
    'USPS', 'UPS', 'FedEx', 'DHL', 'CanadaPost', 'AusPost', 'RoyalMail',
    'DeutschePost', 'LaPoste', 'PostNord', 'PostNL', 'BPost', 'AnPost',
    'ChronoPost', 'Colissimo', 'DPD', 'GLS', 'Hermes', 'TNT', 'Aramex',
    'DHLExpress', 'DHLGlobalMail', 'FedExUK', 'UPSMailInnovations',
    'USPSReturns', 'CanParShipping', 'PurolatorInternational'
  ];

  // Allow case-insensitive matching
  const isValid = supportedCarriers.some(c => 
    c.toLowerCase() === carrier.toLowerCase()
  );

  if (!isValid) {
    logger.warn('Unsupported carrier', { carrier });
  }

  return isValid;
}

/**
 * Utility functions for data sanitization
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
  const sensitiveFields = ['api_key', 'apiKey', 'password', 'token', 'secret', 'key'];
  
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

  return sanitized;
}

/**
 * Mask email address for logging
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain || !localPart) return email;

  const maskedLocal = localPart.length > 2
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for logging
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return phone;
  
  return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
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
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    logger.warn('Invalid URL format', { url });
    return false;
  }
}

/**
 * Validate date string (ISO 8601 format)
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
 * Comprehensive request validation with detailed error reporting
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
 * Export all validation functions
 */
export const validators = {
  validateEnvironmentVariables,
  validateShipmentCreation,
  validateAddressVerification,
  validateShipmentRatesFetch,
  validateShipmentLabelPurchase,
  validateShipmentTracking,
  validateSmartrateRequest,
  validateEasyPostApiKey,
  validatePostalCode,
  validatePhoneNumber,
  validateEmail,
  validateParcelDimensions,
  validateCurrencyAmount,
  validateCountryCode,
  validateCarrier,
  validateJsonString,
  validateUrl,
  validateDateString,
  validateRequestComprehensive
};
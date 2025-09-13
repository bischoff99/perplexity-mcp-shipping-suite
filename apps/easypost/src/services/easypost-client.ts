import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';
import {
  EasyPostClientConfig,
  EasyPostError,
  CONSTANTS
} from '../types/index.js';


/**
 * Extended InternalAxiosRequestConfig with metadata
 */
interface ExtendedInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

/**
 * Production-ready EasyPost API client with comprehensive error handling,
 * retry logic, caching, and performance optimization
 */
export class EasyPostClient {
  private client: AxiosInstance;
  private config: EasyPostClientConfig;
  private cache?: NodeCache;
  private readonly maxRetryDelay = CONSTANTS.MAX_RETRY_DELAY;

  constructor(config: EasyPostClientConfig) {
    this.config = config;

    // Initialize cache if enabled
    if (config.enableCache) {
      this.cache = new NodeCache({
        stdTTL: CONSTANTS.CACHE_TTL,
        checkperiod: 120,
        useClones: false,
        deleteOnExpire: true,
        maxKeys: 1000
      });

      logger.info('EasyPost client cache enabled', {
        ttl: CONSTANTS.CACHE_TTL,
        maxKeys: 1000
      });
    }

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      auth: {
        username: config.apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EasyPost-MCP-Server/1.0.0',
        'X-Client-Version': '1.0.0'
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      maxContentLength: 10 * 1024 * 1024, // 10MB
      maxBodyLength: 10 * 1024 * 1024 // 10MB
    });

    // Setup request interceptor
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );

    // Setup response interceptor
    this.client.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );

    logger.info('EasyPost client initialized', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      cacheEnabled: config.enableCache
    });
  }

  /**
   * GET request with caching support
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.getCacheKey('GET', url, config?.params);

    // Check cache first
    if (this.cache && !config?.headers?.['Cache-Control']) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { url, cacheKey });
        return cached;
      }
    }

    const response = await this.makeRequest<T>('GET', url, undefined, config);

    // Cache successful responses
    if (this.cache && response && this.isCacheable('GET', url)) {
      this.cache.set(cacheKey, response, CONSTANTS.CACHE_TTL);
      logger.debug('Response cached', { url, cacheKey });
    }

    return response;
  }

  /**
   * POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Invalidate related cache entries
    if (this.cache) {
      this.invalidateCache(url);
    }

    return this.makeRequest<T>('POST', url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Invalidate related cache entries
    if (this.cache) {
      this.invalidateCache(url);
    }

    return this.makeRequest<T>('PUT', url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    // Invalidate related cache entries
    if (this.cache) {
      this.invalidateCache(url);
    }

    return this.makeRequest<T>('PATCH', url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Invalidate related cache entries
    if (this.cache) {
      this.invalidateCache(url);
    }

    return this.makeRequest<T>('DELETE', url, undefined, config);
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    let lastError: Error | undefined;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      try {
        logger.debug('Making request', {
          method,
          url,
          attempt,
          maxAttempts: this.config.retryAttempts + 1
        });

        const response = await this.client.request<T>({
          method,
          url,
          data,
          ...config
        });

        const duration = Date.now() - startTime;
        logger.performance(`${method} ${url}`, duration, {
          attempt,
          statusCode: response.status
        });

        return response.data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const duration = Date.now() - startTime;

        logger.warn('Request attempt failed', {
          method,
          url,
          attempt,
          error: lastError.message,
          duration
        });

        // Don't retry on final attempt or non-retryable errors
        if (attempt > this.config.retryAttempts || !this.isRetryableError(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000,
          this.maxRetryDelay
        );

        logger.debug('Retrying request', { method, url, attempt, delay });
        await this.sleep(delay);
      }
    }

    // Convert to EasyPostError and throw
    throw this.convertToEasyPostError(lastError!);
  }

  /**
   * Request interceptor
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const extendedConfig = config as ExtendedInternalAxiosRequestConfig;

    // Add request timing
    extendedConfig.metadata = { startTime: Date.now() };

    // Add request ID for tracing
    if (extendedConfig.headers) {
      extendedConfig.headers['X-Request-ID'] = this.generateRequestId();
    }

    logger.debug('Request starting', {
      method: extendedConfig.method?.toUpperCase() ?? 'unknown',
      url: extendedConfig.url ?? 'unknown',
      hasData: !!extendedConfig.data
    });

    return extendedConfig;
  }

  /**
   * Request error interceptor
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    logger.error('Request setup failed', {
      error: error.message,
      code: error.code
    });

    return Promise.reject(this.convertToEasyPostError(error));
  }

  /**
   * Response interceptor
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    const extendedConfig = response.config as ExtendedInternalAxiosRequestConfig;
    const duration = extendedConfig.metadata?.startTime
      ? Date.now() - extendedConfig.metadata.startTime
      : 0;

    logger.http('Request completed', {
      method: extendedConfig.method?.toUpperCase() ?? 'unknown',
      url: extendedConfig.url ?? 'unknown',
      status: response.status,
      duration
    });

    // Check for EasyPost-specific error responses
    if (response.status >= 400) {
      throw this.createEasyPostErrorFromResponse(response);
    }

    return response;
  }

  /**
   * Response error interceptor
   */
  private handleResponseError(error: AxiosError): Promise<never> {
    const extendedConfig = error.config as ExtendedInternalAxiosRequestConfig | undefined;
    const duration = extendedConfig?.metadata?.startTime
      ? Date.now() - extendedConfig.metadata.startTime
      : 0;

    logger.error('Request failed', {
      method: extendedConfig?.method?.toUpperCase() ?? 'unknown',
      url: extendedConfig?.url ?? 'unknown',
      status: error.response?.status ?? undefined,
      duration,
      error: error.message
    });

    return Promise.reject(this.convertToEasyPostError(error));
  }

  /**
   * Convert various error types to EasyPostError
   */
  private convertToEasyPostError(error: Error | AxiosError): EasyPostError {
    if (error instanceof EasyPostError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      if (error.response) {
        return this.createEasyPostErrorFromResponse(error.response);
      }

      if (error.code === 'ECONNABORTED') {
        return new EasyPostError(
          'Request timeout',
          'REQUEST_TIMEOUT',
          { timeout: this.config.timeout },
          408
        );
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new EasyPostError(
          'Connection failed',
          'CONNECTION_FAILED',
          { code: error.code },
          503
        );
      }
    }

    return new EasyPostError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  /**
   * Create EasyPostError from HTTP response
   */
  private createEasyPostErrorFromResponse(response: AxiosResponse): EasyPostError {
    const { status, data } = response;

    // Handle EasyPost API error format
    if (data && typeof data === 'object') {
      if (data.error) {
        return new EasyPostError(
          data.error.message || `HTTP ${status} Error`,
          data.error.code || `HTTP_${status}`,
          data.error,
          status
        );
      }

      if (data.errors && Array.isArray(data.errors)) {
        const messages = data.errors.map((err: any) => err.message || err).join('; ');
        return new EasyPostError(
          messages || `HTTP ${status} Error`,
          'VALIDATION_ERROR',
          data,
          status
        );
      }
    }

    // Generic HTTP error
    const message = this.getHttpErrorMessage(status);
    return new EasyPostError(
      message,
      `HTTP_${status}`,
      { response: data },
      status
    );
  }

  /**
   * Get human-readable HTTP error message
   */
  private getHttpErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request - Invalid parameters provided',
      401: 'Unauthorized - Invalid or missing API key',
      402: 'Payment Required - Insufficient funds',
      403: 'Forbidden - Access denied',
      404: 'Not Found - Resource does not exist',
      405: 'Method Not Allowed - HTTP method not supported',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation failed',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - EasyPost server error',
      502: 'Bad Gateway - EasyPost server unavailable',
      503: 'Service Unavailable - EasyPost temporarily unavailable',
      504: 'Gateway Timeout - EasyPost server timeout'
    };

    return messages[status] || `HTTP ${status} Error`;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      // Network errors are retryable
      if (!error.response) {
        return true;
      }

      // Server errors (5xx) are retryable
      const status = error.response.status;
      if (status >= 500) {
        return true;
      }

      // Rate limiting is retryable
      if (status === 429) {
        return true;
      }

      // Timeout errors are retryable
      if (error.code === 'ECONNABORTED') {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(method: string, url: string, params?: unknown): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Check if response is cacheable
   */
  private isCacheable(method: string, url: string): boolean {
    // Only cache GET requests
    if (method !== 'GET') {
      return false;
    }

    // Cache safe endpoints
    const cacheableEndpoints = [
      '/account',
      '/carrier_types',
      '/addresses/',
      '/shipments/'
    ];

    return cacheableEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Invalidate cache entries
   */
  private invalidateCache(url: string): void {
    if (!this.cache) return;

    const keys = this.cache.keys();
    const relatedKeys = keys.filter(key => key.includes(url.split('/')[1] || ''));

    relatedKeys.forEach(key => {
      this.cache!.del(key);
    });

    if (relatedKeys.length > 0) {
      logger.debug('Cache invalidated', { url, invalidatedKeys: relatedKeys.length });
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ep_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get client statistics
   */
  public getStats(): {
    cacheEnabled: boolean;
    cacheStats?: {
      keys: number;
      hits: number;
      misses: number;
    };
    config: {
      baseURL: string;
      timeout: number;
      retryAttempts: number;
    };
  } {
    const stats: any = {
      cacheEnabled: !!this.cache,
      config: {
        baseURL: this.config.baseURL,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      }
    };

    if (this.cache) {
      stats.cacheStats = {
        keys: this.cache.keys().length,
        hits: this.cache.getStats().hits,
        misses: this.cache.getStats().misses
      };
    }

    return stats;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    if (this.cache) {
      this.cache.flushAll();
      logger.info('EasyPost client cache cleared');
    }
  }

  /**
   * Health check - test connection to EasyPost API
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.get('/account');
      const latency = Date.now() - startTime;

      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return { healthy: false, latency, error: errorMessage };
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.cache) {
      this.cache.close();
    }
    logger.info('EasyPost client disposed');
  }
}

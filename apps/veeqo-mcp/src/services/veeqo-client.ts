import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import NodeCache from 'node-cache';
import Bottleneck from 'bottleneck';
import Redis from 'ioredis';
import stringify from 'fast-json-stable-stringify';

import { logger } from '../utils/logger.js';
import {
  VeeqoClientConfig,
  VeeqoError,
  CONSTANTS
} from '../types/index.js';

/**
 * Production-ready Veeqo API client with rate limiting, caching, and retry logic
 * Implements Veeqo API v1.0 specifications with comprehensive error handling
 */
export class VeeqoClient {
  private httpClient: AxiosInstance;
  private cache?: NodeCache;
  private redis?: Redis;
  private rateLimiter: Bottleneck;
  private config: VeeqoClientConfig;
  private stats: {
    requests: number;
    hits: number;
    misses: number;
    errors: number;
    rateLimitHits: number;
  };

  constructor(config: VeeqoClientConfig) {
    this.config = config;
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      errors: 0,
      rateLimitHits: 0
    };

    // Initialize HTTP client
    this.httpClient = this.createHttpClient();

    // Initialize caching
    if (config.enableCache) {
      this.initializeCache();
    }

    // Initialize rate limiter based on Veeqo's limits
    // Bucket size: 100, Leak rate: 5/second
    this.rateLimiter = new Bottleneck({
      reservoir: CONSTANTS.RATE_LIMIT_BUCKET_SIZE,
      reservoirRefreshAmount: CONSTANTS.RATE_LIMIT_BUCKET_SIZE,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
      maxConcurrent: 10,
      minTime: 1000 / CONSTANTS.RATE_LIMIT_LEAK_RATE, // 200ms between requests
      retryCount: config.retryAttempts,
      retryDelayMultiplier: 2,
      retryDelayMin: 1000,
      retryDelayMax: 30000
    });

    logger.info('Veeqo client initialized', {
      baseURL: config.apiUrl,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      cacheEnabled: config.enableCache,
      redisEnabled: !!config.redisUrl
    });
  }

  /**
   * Create and configure Axios HTTP client
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Veeqo-MCP-Server/1.0.0',
        'x-api-key': this.config.apiKey
      },
      // Prevent axios from throwing on 4xx/5xx responses
      validateStatus: (status) => status < 500
    });

    // Request interceptor
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestId = this.generateRequestId();
        (config as any).metadata = { requestId, startTime: Date.now() };
        
        logger.debug('Veeqo API request', {
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', {
          error: error.message
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        const requestId = (response.config as any).metadata?.requestId;

        logger.veeqoApi(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status,
          duration,
          { requestId }
        );

        // Track performance
        if (duration > CONSTANTS.RESPONSE_TIMEOUT_MS) {
          logger.performance('veeqo_api_slow', duration, {
            requestId,
            url: response.config.url,
            status: response.status
          });
        }

        return response;
      },
      (error: AxiosError) => {
        const duration = Date.now() - ((error.config as any)?.metadata?.startTime || 0);
        const requestId = (error.config as any)?.metadata?.requestId;

        logger.error('Veeqo API error', {
          requestId,
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          duration,
          error: error.message
        });

        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Initialize caching system
   */
  private initializeCache(): void {
    // In-memory cache
    this.cache = new NodeCache({
      stdTTL: CONSTANTS.CACHE_TTL,
      checkperiod: 60, // Check expired keys every 60 seconds
      useClones: false,
      deleteOnExpire: true,
      maxKeys: 10000
    });

    // Redis cache if available
    if (this.config.redisUrl) {
      try {
        this.redis = new Redis(this.config.redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000
        });

        this.redis.on('connect', () => {
          logger.info('Redis cache connected');
        });

        this.redis.on('error', (error) => {
          logger.error('Redis cache error', { error: error.message });
        });

      } catch (error) {
        logger.error('Failed to initialize Redis cache', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('Cache initialized', {
      inMemory: true,
      redis: !!this.redis,
      ttl: CONSTANTS.CACHE_TTL
    });
  }

  /**
   * GET request with caching and rate limiting
   */
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', url, undefined, { params });
  }

  /**
   * POST request with rate limiting
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * PUT request with rate limiting
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * PATCH request with rate limiting
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * DELETE request with rate limiting
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Core request method with caching, rate limiting, and error handling
   */
  private async request<T = unknown>(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    this.stats.requests++;

    const cacheKey = this.generateCacheKey(method, url, config?.params, data);
    const startTime = Date.now();

    try {
      // Try cache for GET requests
      if (method === 'GET' && this.config.enableCache) {
        const cachedResult = await this.getFromCache<T>(cacheKey);
        if (cachedResult !== null) {
          this.stats.hits++;
          logger.debug('Cache hit', { cacheKey, method, url });
          return cachedResult;
        }
        this.stats.misses++;
      }

      // Execute request with rate limiting
      const response = await this.rateLimiter.schedule(() =>
        this.executeRequest(method, url, data, config)
      );

      const duration = Date.now() - startTime;

      // Handle API errors
      if (response.status >= 400) {
        this.stats.errors++;
        throw this.createVeeqoError(response);
      }

      // Cache successful GET responses
      if (method === 'GET' && this.config.enableCache && response.status === 200) {
        await this.setCache(cacheKey, response.data);
      }

      logger.performance('veeqo_api_request', duration, {
        method,
        url,
        status: response.status
      });

      return response.data as T;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof VeeqoError) {
        throw error;
      }

      this.stats.errors++;
      
      if (axios.isAxiosError(error)) {
        // Handle rate limiting
        if (error.response?.status === 429) {
          this.stats.rateLimitHits++;
          logger.warn('Rate limit exceeded', {
            method,
            url,
            headers: error.response.headers
          });
          
          throw new VeeqoError(
            'Rate limit exceeded',
            'RATE_LIMIT_EXCEEDED',
            { retryAfter: error.response.headers['retry-after'] },
            429
          );
        }

        throw this.createVeeqoError(error.response);
      }

      logger.error('Request failed', {
        method,
        url,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new VeeqoError(
        'Request failed',
        'REQUEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest(
    method: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    const requestConfig: AxiosRequestConfig = {
      method: method as any,
      url,
      data,
      ...config
    };

    return this.httpClient.request(requestConfig);
  }

  /**
   * Create VeeqoError from API response
   */
  private createVeeqoError(response?: AxiosResponse): VeeqoError {
    if (!response) {
      return new VeeqoError('No response received', 'NO_RESPONSE');
    }

    const { status, data } = response;
    
    // Extract error details from Veeqo API response
    let message = 'API request failed';
    let code = 'API_ERROR';
    let details = data;

    if (data && typeof data === 'object') {
      if (data.error && typeof data.error === 'object') {
        message = data.error.message || message;
        code = data.error.code || code;
        details = data.error;
      } else if (data.message) {
        message = data.message;
      } else if (data.errors && Array.isArray(data.errors)) {
        message = data.errors.join(', ');
      }
    }

    // Map HTTP status codes to error codes
    switch (status) {
      case 400:
        code = 'BAD_REQUEST';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        break;
      case 403:
        code = 'FORBIDDEN';
        break;
      case 404:
        code = 'NOT_FOUND';
        break;
      case 422:
        code = 'VALIDATION_ERROR';
        break;
      case 429:
        code = 'RATE_LIMIT_EXCEEDED';
        break;
      case 500:
        code = 'INTERNAL_SERVER_ERROR';
        break;
      case 502:
      case 503:
      case 504:
        code = 'SERVICE_UNAVAILABLE';
        break;
    }

    return new VeeqoError(message, code, details, status);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(
    method: string,
    url: string,
    params?: Record<string, unknown>,
    data?: unknown
  ): string {
    const keyData = {
      method,
      url,
      params: params || {},
      data: method !== 'GET' ? data : undefined
    };
    
    return `veeqo:${stringify(keyData)}`;
  }

  /**
   * Get data from cache
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          return JSON.parse(redisValue) as T;
        }
      }

      // Fall back to in-memory cache
      if (this.cache) {
        const value = this.cache.get<T>(key);
        return value || null;
      }

      return null;
    } catch (error) {
      logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Set data in cache
   */
  private async setCache(key: string, value: unknown): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      // Set in Redis
      if (this.redis) {
        await this.redis.setex(key, CONSTANTS.CACHE_TTL, serializedValue);
      }

      // Set in in-memory cache
      if (this.cache) {
        this.cache.set(key, value);
      }
    } catch (error) {
      logger.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Clear cache
   */
  async clearCache(pattern?: string): Promise<void> {
    try {
      if (this.redis) {
        if (pattern) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.flushall();
        }
      }

      if (this.cache) {
        if (pattern) {
          const keys = this.cache.keys().filter(key => 
            key.includes(pattern.replace('*', ''))
          );
          keys.forEach(key => this.cache!.del(key));
        } else {
          this.cache.flushAll();
        }
      }

      logger.info('Cache cleared', { pattern });
    } catch (error) {
      logger.error('Cache clear error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Health check for the Veeqo API connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Simple API call to check connectivity
      await this.get('/current_user');
      
      const latency = Date.now() - startTime;
      
      return {
        status: latency < 5000 ? 'healthy' : 'unhealthy',
        latency,
        errors
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      errors.push(errorMessage);
      
      return {
        status: 'unhealthy',
        latency,
        errors
      };
    }
  }

  /**
   * Get client statistics
   */
  getStats(): {
    requests: number;
    hits: number;
    misses: number;
    errors: number;
    rateLimitHits: number;
    hitRate: number;
    errorRate: number;
    cacheEnabled: boolean;
    redisConnected: boolean;
  } {
    const hitRate = this.stats.requests > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    const errorRate = this.stats.requests > 0 
      ? (this.stats.errors / this.stats.requests) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheEnabled: this.config.enableCache,
      redisConnected: !!this.redis && this.redis.status === 'ready'
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    try {
      // Stop rate limiter
      this.rateLimiter.stop();

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
      }

      // Clear in-memory cache
      if (this.cache) {
        this.cache.flushAll();
        this.cache.close();
      }

      logger.info('Veeqo client disposed');
    } catch (error) {
      logger.error('Error disposing Veeqo client', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
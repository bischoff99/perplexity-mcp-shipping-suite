import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: HttpClientConfig = {}) {
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('HTTP Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers
        });
        return config;
      },
      (error) => {
        logger.error('HTTP Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('HTTP Response', {
          status: response.status,
          url: response.config.url,
          method: response.config.method?.toUpperCase()
        });
        return response;
      },
      async (error) => {
        const config = error.config;

        logger.error('HTTP Response Error', {
          status: error.response?.status,
          url: config?.url,
          method: config?.method?.toUpperCase(),
          message: error.message
        });

        // Retry logic for network errors or 5xx responses
        if (this.shouldRetry(error) && config && !config._retry) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;

          if (config._retryCount <= this.retries) {
            logger.warn('Retrying HTTP request', {
              attempt: config._retryCount,
              maxRetries: this.retries,
              url: config.url
            });

            await this.delay(this.retryDelay * config._retryCount);
            return this.client(config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    return (
      !error.response || // Network error
      error.response.status >= 500 || // Server error
      error.code === 'ECONNRESET' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNABORTED'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setApiKey(key: string, headerName: string = 'X-API-Key') {
    this.client.defaults.headers.common[headerName] = key;
  }
}

export const createHttpClient = (config: HttpClientConfig) => new HttpClient(config);
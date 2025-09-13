import { EventEmitter } from 'events';
import { HttpClient, createHttpClient } from '@perplexity/shared';
import type { MCPRequest, MCPResponse } from '@perplexity/shared';

export interface MCPClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class MCPClient extends EventEmitter {
  private httpClient: HttpClient;
  private requestId = 0;

  constructor(config: MCPClientConfig) {
    super();

    this.httpClient = createHttpClient({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
  }

  private getNextId(): number {
    return ++this.requestId;
  }

  private createRequest(method: string, params?: any): MCPRequest {
    return {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method,
      params
    };
  }

  async call<T = any>(method: string, params?: any): Promise<T> {
    const request = this.createRequest(method, params);

    try {
      this.emit('request', request);

      const response = await this.httpClient.post<MCPResponse<T>>('/mcp', request);

      this.emit('response', response);

      if (response.error) {
        const error = new Error(response.error.message);
        (error as any).code = response.error.code;
        (error as any).data = response.error.data;
        this.emit('error', error);
        throw error;
      }

      if (response.result === undefined) {
        throw new Error('No result in response');
      }

      return response.result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async batch<T = any>(requests: Array<{ method: string; params?: any }>): Promise<T[]> {
    const mcpRequests = requests.map(req => this.createRequest(req.method, req.params));

    try {
      this.emit('batchRequest', mcpRequests);

      const responses = await this.httpClient.post<MCPResponse<T>[]>('/mcp/batch', mcpRequests);

      this.emit('batchResponse', responses);

      const results: T[] = [];
      const errors: Error[] = [];

      for (const response of responses) {
        if (response.error) {
          const error = new Error(response.error.message);
          (error as any).code = response.error.code;
          (error as any).data = response.error.data;
          errors.push(error);
        } else if (response.result !== undefined) {
          results.push(response.result);
        }
      }

      if (errors.length > 0) {
        const batchError = new Error(`Batch request failed with ${errors.length} errors`);
        (batchError as any).code = -32000;
        (batchError as any).data = { errors };
        this.emit('error', batchError);
        throw batchError;
      }

      return results;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  setAuthToken(token: string) {
    this.httpClient.setAuthToken(token);
  }

  setApiKey(key: string, headerName?: string) {
    this.httpClient.setApiKey(key, headerName);
  }
}

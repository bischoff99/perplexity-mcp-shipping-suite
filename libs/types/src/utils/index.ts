// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// Environment Types
export type Environment = 'development' | 'staging' | 'production';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Event Types
export interface BaseEvent {
  id: string;
  timestamp: string;
  type: string;
  source: string;
}

export interface ShipmentEvent extends BaseEvent {
  type: 'shipment.created' | 'shipment.updated' | 'shipment.delivered' | 'shipment.failed';
  shipmentId: string;
  data: any;
}

export interface WebhookEvent extends BaseEvent {
  type: 'webhook.received' | 'webhook.processed' | 'webhook.failed';
  webhookId: string;
  payload: any;
}

// Configuration Types
export interface AppConfig {
  environment: Environment;
  logLevel: LogLevel;
  apiKeys: {
    easypost: string;
    veeqo: string;
  };
  services: {
    easypost: {
      url: string;
      timeout: number;
    };
    veeqo: {
      url: string;
      timeout: number;
    };
  };
  redis?: {
    url: string;
    ttl: number;
  };
  webhooks?: {
    enabled: boolean;
    secret: string;
    port: number;
  };
}

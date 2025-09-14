# TypeScript Development Rules

## File Patterns

### TypeScript Source Files
- `**/*.ts` - TypeScript source files
- `**/*.tsx` - TypeScript React components
- `**/*.d.ts` - TypeScript type definition files
- `**/*.test.{ts,tsx}` - Jest test files
- `**/*.spec.{ts,tsx}` - Specification test files
- `**/*.stories.{ts,tsx}` - Storybook story files

### Configuration Files
- `tsconfig*.json` - TypeScript configuration
- `*.config.{ts,js}` - Build tool configurations
- `eslint.config.{js,ts}` - ESLint configuration
- `.prettierrc*` - Prettier configuration
- `jest.config.{ts,js}` - Jest configuration

## DO: TypeScript Best Practices

### Type Safety
- **Use strict TypeScript configuration** with `strict: true`
- **Provide explicit return types** for all public functions and methods
- **Use type assertions sparingly** - prefer type guards and narrowing
- **Define interfaces for object shapes** rather than using inline types
- **Use union types** for values that can be multiple types
- **Use generic types** for reusable components and functions
- **Prefer `unknown` over `any`** when type is truly unknown

### Code Organization
- **Use barrel exports** (`index.ts`) for clean module imports
- **Group related types** in dedicated type definition files
- **Use consistent naming conventions** (PascalCase for types, camelCase for variables)
- **Organize imports** with external libraries first, then internal modules
- **Use path mapping** in `tsconfig.json` for cleaner imports
- **Separate business logic** from framework-specific code

### Error Handling
- **Create custom error classes** with proper inheritance
- **Use discriminated unions** for error handling patterns
- **Implement proper async error handling** with try/catch
- **Use Result/Either patterns** for functional error handling
- **Type your errors** - don't use `any` or `unknown` for caught errors

### Performance
- **Use readonly types** for immutable data
- **Implement proper tree shaking** with ES modules
- **Use lazy loading** for large modules
- **Avoid circular dependencies** between modules
- **Use type-only imports** when importing types: `import type { ... }`

### Testing
- **Type your test data** with proper interfaces
- **Use type-safe mocking** libraries like `ts-mockito` or typed `jest.fn()`
- **Test type definitions** with `tsd` or similar tools
- **Mock external dependencies** with proper typing
- **Use test utilities** for common setup patterns

## DON'T: TypeScript Anti-Patterns

### Type Safety Anti-Patterns
- **Don't use `any` type** - always specify proper types
- **Don't use type assertions** (`as`) without justification
- **Don't ignore TypeScript errors** with `@ts-ignore` without comments
- **Don't use function overloads** when union types would suffice
- **Don't create overly complex generic constraints**
- **Don't use `Object` or `{}` types** - be specific about object shapes

### Code Organization Anti-Patterns
- **Don't create god files** - keep modules focused and small
- **Don't mix default and named exports** in the same module
- **Don't use barrel exports** for large numbers of exports (performance)
- **Don't create circular dependencies** between modules
- **Don't ignore unused imports** - clean them up regularly

### Performance Anti-Patterns
- **Don't use complex computed types** that slow down compilation
- **Don't import entire libraries** when only using specific functions
- **Don't create unnecessary type instantiations**
- **Don't use synchronous operations** in async contexts

## MCP-Specific TypeScript Patterns

### MCP Tool Definition
```typescript
import { z } from 'zod';

// Input validation schema
const CreateShipmentSchema = z.object({
  from_address: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  to_address: z.object({
    name: z.string(),
    street1: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('US'),
  }),
  parcel: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    weight: z.number().positive(),
  }),
});

// Infer TypeScript types from Zod schema
type CreateShipmentRequest = z.infer<typeof CreateShipmentSchema>;

// MCP Tool interface
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Tool definition with proper typing
export const createShipmentTool: MCPTool = {
  name: 'create_shipment',
  description: 'Create a new shipment with carrier rate shopping',
  inputSchema: {
    type: 'object',
    properties: {
      from_address: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          street1: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string', default: 'US' },
        },
        required: ['name', 'street1', 'city', 'state', 'zip'],
      },
      to_address: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          street1: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string', default: 'US' },
        },
        required: ['name', 'street1', 'city', 'state', 'zip'],
      },
      parcel: {
        type: 'object',
        properties: {
          length: { type: 'number', minimum: 0 },
          width: { type: 'number', minimum: 0 },
          height: { type: 'number', minimum: 0 },
          weight: { type: 'number', minimum: 0 },
        },
        required: ['length', 'width', 'height', 'weight'],
      },
    },
    required: ['from_address', 'to_address', 'parcel'],
  },
};
```

### Proper Error Handling
```typescript
// Custom error classes with proper inheritance
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, -32602, details); // JSON-RPC Invalid params
    this.name = 'ValidationError';
  }
}

export class ShipmentError extends MCPError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, -32000, details); // Server error
    this.name = 'ShipmentError';
  }
}

// Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Function using Result pattern
async function createShipment(
  request: CreateShipmentRequest
): Promise<Result<ShipmentResponse, ShipmentError>> {
  try {
    // Validate input
    const validated = CreateShipmentSchema.parse(request);
    
    // Call external service
    const response = await easyPostClient.createShipment(validated);
    
    return { success: true, data: response };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: new ValidationError('Invalid input', { details: error.errors })
      };
    }
    
    return { 
      success: false, 
      error: new ShipmentError('Failed to create shipment', { 
        originalError: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
```

### Service Layer Pattern
```typescript
import { injectable, inject } from 'inversify';
import { Logger } from 'winston';

// Interface for dependency injection
export interface IEasyPostService {
  createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse>;
  getShipment(id: string): Promise<ShipmentResponse>;
  cancelShipment(id: string): Promise<void>;
}

// Implementation with proper typing and error handling
@injectable()
export class EasyPostService implements IEasyPostService {
  constructor(
    @inject('Logger') private readonly logger: Logger,
    @inject('HttpClient') private readonly httpClient: IHttpClient,
    @inject('RateLimiter') private readonly rateLimiter: Bottleneck
  ) {}

  async createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    const correlationId = crypto.randomUUID();
    
    this.logger.info('Creating shipment', { 
      correlationId, 
      fromZip: request.from_address.zip,
      toZip: request.to_address.zip 
    });

    try {
      // Rate limiting
      const response = await this.rateLimiter.schedule(async () => {
        return this.httpClient.post<ShipmentResponse>('/v2/shipments', {
          shipment: request,
        });
      });

      this.logger.info('Shipment created successfully', { 
        correlationId, 
        shipmentId: response.id 
      });

      return response;
    } catch (error) {
      this.logger.error('Failed to create shipment', { 
        correlationId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new ShipmentError('Shipment creation failed', {
        correlationId,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getShipment(id: string): Promise<ShipmentResponse> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Shipment ID is required');
    }

    try {
      const response = await this.rateLimiter.schedule(async () => {
        return this.httpClient.get<ShipmentResponse>(`/v2/shipments/${id}`);
      });

      return response;
    } catch (error) {
      throw new ShipmentError(`Failed to retrieve shipment ${id}`, {
        shipmentId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async cancelShipment(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Shipment ID is required');
    }

    try {
      await this.rateLimiter.schedule(async () => {
        return this.httpClient.delete(`/v2/shipments/${id}`);
      });

      this.logger.info('Shipment cancelled successfully', { shipmentId: id });
    } catch (error) {
      throw new ShipmentError(`Failed to cancel shipment ${id}`, {
        shipmentId: id,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

### Test Examples
```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mock, MockProxy } from 'jest-mock-extended';
import nock from 'nock';

import { EasyPostService } from '../services/easypost.service';
import { ShipmentError, ValidationError } from '../errors';
import type { Logger } from 'winston';
import type { IHttpClient } from '../interfaces';

describe('EasyPostService', () => {
  let service: EasyPostService;
  let mockLogger: MockProxy<Logger>;
  let mockHttpClient: MockProxy<IHttpClient>;

  beforeEach(() => {
    mockLogger = mock<Logger>();
    mockHttpClient = mock<IHttpClient>();
    service = new EasyPostService(mockLogger, mockHttpClient, rateLimiter);
  });

  describe('createShipment', () => {
    const validRequest: CreateShipmentRequest = {
      from_address: {
        name: 'John Doe',
        street1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        country: 'US',
      },
      to_address: {
        name: 'Jane Smith',
        street1: '456 Oak Ave',
        city: 'Somewhere',
        state: 'NY',
        zip: '67890',
        country: 'US',
      },
      parcel: {
        length: 10,
        width: 8,
        height: 6,
        weight: 2.5,
      },
    };

    it('should create shipment successfully', async () => {
      const expectedResponse: ShipmentResponse = {
        id: 'shp_123',
        status: 'created',
        rates: [],
        from_address: validRequest.from_address,
        to_address: validRequest.to_address,
        parcel: validRequest.parcel,
      };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await service.createShipment(validRequest);

      expect(result).toEqual(expectedResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v2/shipments', {
        shipment: validRequest,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating shipment',
        expect.objectContaining({
          fromZip: '12345',
          toZip: '67890',
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API connection failed');
      mockHttpClient.post.mockRejectedValue(apiError);

      await expect(service.createShipment(validRequest))
        .rejects.toThrow(ShipmentError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create shipment',
        expect.objectContaining({
          error: 'API connection failed',
        })
      );
    });
  });

  describe('getShipment', () => {
    it('should validate shipment ID', async () => {
      await expect(service.getShipment('')).rejects.toThrow(ValidationError);
      await expect(service.getShipment(null as any)).rejects.toThrow(ValidationError);
    });

    it('should retrieve shipment successfully', async () => {
      const expectedResponse: ShipmentResponse = {
        id: 'shp_123',
        status: 'created',
        rates: [],
      };

      mockHttpClient.get.mockResolvedValue(expectedResponse);

      const result = await service.getShipment('shp_123');

      expect(result).toEqual(expectedResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v2/shipments/shp_123');
    });
  });
});
```

Always prioritize type safety, proper error handling, and comprehensive testing in your TypeScript code.
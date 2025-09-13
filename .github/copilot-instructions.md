# GitHub Copilot Instructions for Perplexity MCP Shipping Suite

## Project Overview

This is a **Model Context Protocol (MCP) Shipping Automation Suite** built with TypeScript/Node.js using **Nx monorepo**. The project implements MCP servers for shipping and inventory management with EasyPost and Veeqo API integrations.

### Architecture
- **Nx monorepo** with `apps/*` and `libs/*` structure
- **Three main applications**:
  - `apps/easypost/` - EasyPost MCP Server (port 3000) - Shipping automation
  - `apps/veeqo/` - Veeqo MCP Server (port 3002) - Inventory management  
  - `apps/web-dashboard/` - Next.js dashboard (port 3003) - Frontend interface
  - `apps/web-dashboard-e2e/` - E2E tests for dashboard
- **Shared libraries** in `libs/`:
  - `libs/shared/` - Common utilities, logger, validation
  - `libs/mcp-client/` - MCP protocol client implementation  
  - `libs/ui-components/` - Shared React components
- **Docker-based deployment** with Redis and PostgreSQL

### Critical Build Dependencies
- Libraries must be built BEFORE apps: `pnpm run build:libs` then `pnpm run build:apps`
- Use `nx affected` commands to rebuild only changed projects
- Run `pnpm run quick-start` for full setup from scratch

## Development Context

### Core Technologies
- **TypeScript** with strict mode and ES2022 target
- **Nx 21.5.2** for monorepo management - use `nx` commands for all operations
- **Model Context Protocol (MCP)** JSON-RPC 2.0 implementation with `@modelcontextprotocol/sdk`
- **Express.js** for HTTP servers and health checks
- **Next.js** for web dashboard with React and Tailwind CSS
- **Zod** for runtime validation and type safety
- **Winston** for structured JSON logging
- **Jest** for testing with 70% coverage requirement
- **Docker** for containerization and deployment
- **pnpm** for package management (NOT npm despite package.json comments)

### Essential Nx Commands
```bash
# Development (start all services in parallel)
pnpm run dev                 # All services 
nx serve easypost           # Individual app
nx serve web-dashboard      # Next.js dashboard

# Building (respect dependency order)
nx run-many -t build --projects=shared,mcp-client,ui-components  # Libs first
nx run-many -t build --projects=easypost,veeqo,web-dashboard     # Then apps
pnpm run build:libs && pnpm run build:apps                       # Or use scripts

# Testing and linting
nx run-many -t test         # All tests
nx affected -t test         # Only affected projects
nx run-many -t lint --fix   # Fix linting issues
```

### Key Patterns

#### MCP Server Structure (apps/easypost/src/server.ts, apps/veeqo/src/server.ts)
```typescript
export class MCPServer {
  private server: Server;
  private httpServer?: HttpServer;
  private app?: Express;
  
  constructor(config: MCPServerConfig) {
    this.server = new Server({
      name: 'shipping-server',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });
  }

  private setupMCPHandlers(): void {
    // Register MCP tools with proper validation
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.handlers.callTool(name, args);
    });
  }
  
  private setupHttpServer(): void {
    // Health checks, metrics, webhook endpoints
    this.app = express();
    this.app.use(helmet(), cors());
    this.app.get('/health', this.healthCheck.bind(this));
  }
}
```

#### Shared Library Usage (libs/shared/src/lib/)
```typescript
import { logger } from '@perplexity/shared';
import { validateShipmentRequest } from '@perplexity/shared';
import { HttpClient } from '@perplexity/shared';

// All apps import from shared libs using workspace aliases
// Never duplicate utilities across apps
```

#### API Integration Pattern
```typescript
export class APIService {
  constructor(
    private apiKey: string,
    private baseURL: string,
    private rateLimiter: Bottleneck
  ) {}
  
  async makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Retry logic with exponential backoff
    // Rate limiting enforcement
    // Comprehensive error handling
    // Response validation with Zod
  }
}
```

#### Validation Pattern
```typescript
const requestSchema = z.object({
  // Define strict schemas for all inputs
  // Use optional() for optional fields
  // Provide meaningful error messages
});

export const validateRequest = (data: unknown) => {
  return requestSchema.parse(data);
};
```

## Code Generation Guidelines

### File Structure Conventions
- **MCP Handlers**: `src/handlers/{feature}.ts`
- **API Services**: `src/services/{provider}.ts`
- **Type Definitions**: `src/types/{domain}.ts`
- **Validation Schemas**: `src/utils/validation.ts`
- **Tests**: `tests/{feature}.test.ts` or `tests/{feature}.spec.ts`

### Naming Conventions
- **Classes**: PascalCase (e.g., `EasyPostMCPServer`)
- **Functions/Methods**: camelCase (e.g., `createShipment`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ShipmentRequest`)
- **Environment Variables**: UPPER_SNAKE_CASE (e.g., `EASYPOST_API_KEY`)

### TypeScript Guidelines
- Use **explicit return types** for all public methods
- Implement **proper error handling** with typed errors
- Use **Zod schemas** for runtime validation
- Prefer **composition over inheritance**
- Use **strict TypeScript configuration**

```typescript
// Good: Explicit types and error handling
async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
  try {
    const validated = shipmentSchema.parse(request);
    const result = await this.easyPostService.createShipment(validated);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to create shipment', { error: error.message });
    throw new ShipmentError('Shipment creation failed', error);
  }
}
```

### MCP Protocol Implementation
- **Tool Registration**: Define tools with proper schemas and descriptions
- **Request Handling**: Validate inputs, process requests, return structured responses
- **Error Responses**: Use MCP-compliant error format with codes and messages
- **Resource Management**: Implement proper resource handlers for account data

```typescript
// MCP Tool Definition Pattern
{
  name: 'create_shipment',
  description: 'Create a new shipment with carrier rate shopping',
  inputSchema: {
    type: 'object',
    properties: {
      from_address: { $ref: '#/definitions/address' },
      to_address: { $ref: '#/definitions/address' },
      parcel: { $ref: '#/definitions/parcel' }
    },
    required: ['from_address', 'to_address', 'parcel']
  }
}
```

### Testing Guidelines
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API integrations with nock
- **E2E Tests**: Test complete workflows with supertest
- **Coverage**: Maintain 70%+ coverage across all metrics
- **Test Structure**: Arrange-Act-Assert pattern

```typescript
describe('EasyPost Service', () => {
  beforeEach(() => {
    nock('https://api.easypost.com')
      .post('/v2/shipments')
      .reply(200, mockShipmentResponse);
  });

  it('should create shipment successfully', async () => {
    // Arrange
    const request = createValidShipmentRequest();
    
    // Act
    const result = await easyPostService.createShipment(request);
    
    // Assert
    expect(result).toMatchObject({
      id: expect.stringMatching(/^shp_/),
      status: 'created'
    });
  });
});
```

### API Integration Best Practices
- **Rate Limiting**: Use Bottleneck for API rate limiting
- **Retry Logic**: Implement exponential backoff for failed requests
- **Error Handling**: Transform API errors to application errors
- **Response Caching**: Cache appropriate responses with TTL
- **Logging**: Log all API calls with correlation IDs

### Environment Configuration
- Use **dotenv** for local development
- Validate required environment variables at startup
- Provide sensible defaults where possible
- Document all environment variables in README

```typescript
const config = {
  easyPostApiKey: requireEnv('EASYPOST_API_KEY'),
  veeqoApiKey: requireEnv('VEEQO_API_KEY'),
  logLevel: process.env.LOG_LEVEL || 'info',
  enableCache: process.env.ENABLE_CACHE === 'true'
};
```

### Security Considerations
- **API Keys**: Never log or expose API keys
- **Input Validation**: Validate all external inputs
- **Rate Limiting**: Implement proper rate limiting
- **CORS**: Configure CORS for web integration
- **Webhooks**: Verify webhook signatures

### Performance Guidelines
- **Response Times**: Target <200ms for MCP tool responses
- **Connection Pooling**: Use HTTP connection pooling
- **Caching**: Implement Redis caching for appropriate data
- **Database**: Use connection pooling for PostgreSQL
- **Monitoring**: Include health checks and metrics endpoints

## Common Tasks

### Adding a New MCP Tool
1. Define TypeScript types in `src/types/`
2. Create Zod validation schema in `src/utils/validation.ts`
3. Implement handler in `src/handlers/`
4. Register tool in MCP server configuration
5. Add comprehensive tests
6. Update API documentation

### Adding a New API Integration
1. Create service class in `src/services/`
2. Implement rate limiting and retry logic
3. Add proper error handling and logging
4. Create TypeScript types for responses
5. Add integration tests with nock
6. Update environment configuration

### Debugging and Logging
- Use structured logging with Winston
- Include correlation IDs for request tracing
- Log at appropriate levels (error, warn, info, debug)
- Never log sensitive information
- Use health check endpoints for monitoring

### Working with Dependencies

### Package Management
- Use **pnpm** for dependency management (NOT npm despite package.json comments)
- Keep dependencies updated and secure
- Use exact versions for production dependencies
- Group dev dependencies appropriately

### Key Dependencies
- `@modelcontextprotocol/sdk` - Core MCP implementation
- `@types/node` - Node.js type definitions
- `express` - HTTP server framework
- `zod` - Runtime validation
- `winston` - Logging framework
- `bottleneck` - Rate limiting
- `jest` - Testing framework
- `nock` - HTTP mocking for tests

## Monorepo Guidelines

### Nx Workspace
- Use Nx commands for building and testing
- Leverage shared libraries across applications
- Use project references for TypeScript
- Follow Nx conventions for project structure

### Shared Libraries
- **shared**: Common utilities and types
- **mcp-client**: MCP protocol client implementation
- **ui-components**: Shared UI components for web interface

Remember: This is a production shipping automation system handling real business transactions. Always prioritize reliability, security, and comprehensive error handling in all code suggestions.
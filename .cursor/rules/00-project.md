# Project Overview and Guidelines

## About This Project

This is a **Model Context Protocol (MCP) Shipping Automation Suite** built with TypeScript/Node.js using **Nx monorepo**. The project implements MCP servers for shipping and inventory management with EasyPost and Veeqo API integrations.

### Repository Structure
```
perplexity-mcp-shipping-suite/
├── apps/
│   ├── easypost/          # EasyPost MCP Server (port 3000)
│   ├── veeqo/             # Veeqo MCP Server (port 3002) 
│   ├── web-dashboard/     # Next.js Dashboard (port 3003)
│   └── web-dashboard-e2e/ # E2E tests
├── libs/
│   ├── shared/            # Common utilities, logger, validation
│   ├── mcp-client/        # MCP protocol client implementation
│   └── ui-components/     # Shared React components
├── .cursor/               # Cursor IDE configuration
├── .devcontainer/         # Development container setup
└── scripts/               # Automation and CI scripts
```

## File Patterns and Globs

### Core TypeScript Files
- `apps/**/*.{ts,tsx}` - Application source code
- `libs/**/*.{ts,tsx}` - Shared library code
- `**/*.test.{ts,tsx}` - Test files
- `**/*.spec.{ts,tsx}` - Specification test files

### Configuration Files
- `*.config.{js,ts}` - Build and tool configuration
- `.env*` - Environment configuration (never commit secrets!)
- `package.json` - Package definitions and scripts
- `tsconfig*.json` - TypeScript configuration

### Documentation
- `**/*.md` - Documentation files
- `docs/**/*` - Project documentation
- `README.md` - Project overview

## DO: Best Practices

### Code Quality
- **Always use TypeScript** with strict type checking
- **Use Zod schemas** for runtime validation of external inputs
- **Implement proper error handling** with typed errors and meaningful messages
- **Follow MCP protocol standards** (JSON-RPC 2.0) for all MCP implementations
- **Use dependency injection** and composition over inheritance
- **Write comprehensive tests** with minimum 70% coverage

### Development Workflow
- **Run `pnpm run build:libs` before `pnpm run build:apps`** - libraries must build first
- **Use Nx commands** for all operations (`nx serve`, `nx test`, `nx build`)
- **Test changes incrementally** with `nx affected` commands
- **Use proper branch naming**: `feature/`, `fix/`, `chore/`, `docs/`
- **Commit frequently** with conventional commit messages

### Security
- **Never commit secrets** - use environment variables and `.env.example`
- **Validate all external inputs** with Zod schemas
- **Use rate limiting** for all external API calls
- **Implement proper authentication** and authorization
- **Follow least-privilege principle** for API access

### Performance
- **Use connection pooling** for databases and HTTP clients
- **Implement caching** with Redis for appropriate data
- **Use rate limiting** with exponential backoff for API calls
- **Monitor memory usage** and optimize for production
- **Target <2s response times** for MCP tool operations

## DON'T: Anti-Patterns

### Code Anti-Patterns
- **Don't use `any` types** - always specify proper TypeScript types
- **Don't skip input validation** - all external data must be validated
- **Don't ignore error cases** - handle all possible failure scenarios  
- **Don't duplicate utilities** across apps - use shared libraries
- **Don't break dependency order** - libs must build before apps

### Development Anti-Patterns
- **Don't bypass Nx** - use Nx commands instead of direct npm/node
- **Don't skip testing** - all new code needs tests
- **Don't commit incomplete features** - use feature branches
- **Don't ignore linting errors** - fix or suppress with justification
- **Don't hardcode environment-specific values**

### Security Anti-Patterns
- **Don't log sensitive information** - API keys, tokens, user data
- **Don't expose internal errors** to external users
- **Don't skip rate limiting** on API endpoints
- **Don't use weak authentication** mechanisms
- **Don't store secrets in code** or version control

### Performance Anti-Patterns
- **Don't make unnecessary API calls** - implement caching
- **Don't create memory leaks** - properly dispose resources
- **Don't ignore connection limits** - use pooling
- **Don't block the event loop** - use async/await properly
- **Don't skip monitoring** - implement health checks

## Architecture Principles

### MCP Protocol Implementation
- All MCP servers must implement proper JSON-RPC 2.0 protocol
- Use structured tool definitions with JSON Schema validation
- Implement proper resource management for account data
- Provide meaningful error messages with appropriate error codes
- Support graceful degradation when external services are unavailable

### Microservices Design
- Each MCP server is independently deployable
- Services communicate via well-defined APIs
- Shared business logic resides in `libs/shared`
- Each service has its own database/storage if needed
- Health checks and monitoring for all services

### API Integration Patterns
- Use Bottleneck for rate limiting external API calls
- Implement exponential backoff for retries
- Transform external errors to internal error types
- Cache appropriate responses with TTL
- Log all API interactions with correlation IDs

## Examples

### Good TypeScript Code
```typescript
// Good: Explicit types and proper error handling
async function createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
  try {
    const validated = shipmentSchema.parse(request);
    const result = await this.easyPostService.createShipment(validated);
    logger.info('Shipment created successfully', { shipmentId: result.id });
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to create shipment', { error: error.message });
    throw new ShipmentError('Shipment creation failed', error);
  }
}
```

### Good MCP Tool Definition
```typescript
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

### Good Test Structure
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

This is a production shipping automation system handling real business transactions. Always prioritize reliability, security, and comprehensive error handling.
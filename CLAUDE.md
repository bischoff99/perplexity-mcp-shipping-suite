# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-service shipping automation platform consisting of three main components:
1. **EasyPost MCP Server** (`/easypost`) - Model Context Protocol server for EasyPost shipping API integration
2. **Veeqo MCP Server** (`/veeqo`) - MCP server for Veeqo inventory management and order processing
3. **Web Application** (`/web`) - Frontend shipping automation interface

## Development Commands

### EasyPost Service
```bash
cd easypost
npm run dev           # Start development server with hot reload
npm run build         # Build TypeScript to dist/
npm run test          # Run Jest tests
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Format code with Prettier
npm run precommit     # Run lint, typecheck, and tests before commit
```

### Veeqo Service
```bash
cd veeqo
npm run dev           # Start development server with hot reload
npm run build         # Build TypeScript to dist/
npm run test          # Run Jest tests
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Format code with Prettier
npm run webhook:dev   # Start with webhook server on port 3001
npm run precommit     # Run lint, typecheck, and tests before commit
```

### Docker Operations
```bash
# EasyPost
cd easypost
docker-compose up -d  # Start EasyPost service
docker build -t easypost-mcp .
docker run -p 3000:3000 --env-file .env easypost-mcp

# Veeqo
cd veeqo
docker-compose up -d  # Start Veeqo service with Redis
docker build -t veeqo-mcp .
docker run -p 3000:3000 -p 3001:3001 --env-file .env veeqo-mcp
```

## Architecture

### Service Structure
Both MCP servers follow identical architecture patterns:
- **TypeScript** with strict mode configuration
- **Model Context Protocol (MCP)** JSON-RPC 2.0 implementation
- **Zod** for runtime validation
- **Winston** for structured JSON logging
- **Jest** for testing with 70% coverage requirements
- **Express** servers for health checks and webhooks

### Key Directory Layout
```
easypost/veeqo/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── handlers/          # Business logic handlers
│   ├── services/          # API clients with retry logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Logger, validation utilities
└── tests/                 # Unit, integration, E2E tests
```

### TypeScript Configuration
- Target: ES2022
- Module: ESNext with Node resolution
- Strict mode with all checks enabled
- Path aliases configured (@/ prefix)
- Source maps enabled for debugging

## API Integration Details

### EasyPost Integration
- Base URL: `https://api.easypost.com/v2`
- Authentication: API Key in headers
- Rate limiting: Built-in retry with exponential backoff
- Key features: Shipment creation, rate shopping, label generation, tracking

### Veeqo Integration
- Base URL: `https://api.veeqo.com`
- Authentication: x-api-key header
- Rate limit: 5 requests/second enforced
- Key features: Order management, inventory tracking, webhook support

## Testing Strategy

All services use Jest with:
- Unit tests for individual components
- Integration tests with Nock for HTTP mocking
- E2E tests with Supertest
- Minimum 70% coverage requirement
- Test files use `.test.ts` or `.spec.ts` suffix

Run single test:
```bash
npm test -- path/to/test.test.ts
```

## Environment Configuration

Required environment variables:
- `EASYPOST_API_KEY` - EasyPost API credentials
- `VEEQO_API_KEY` - Veeqo API credentials
- `NODE_ENV` - development/production/test
- `LOG_LEVEL` - error/warn/info/debug
- `ENABLE_CACHE` - Redis caching flag
- `REDIS_URL` - Redis connection string (optional)

## Code Quality Standards

- ESLint with TypeScript plugin for linting
- Prettier for consistent formatting
- Conventional commits format
- No unused imports or variables
- Explicit return types for functions
- Comprehensive error handling with typed errors

## Common Development Tasks

### Adding a New MCP Tool
1. Define types in `src/types/index.ts`
2. Add Zod validation schema in `src/utils/validation.ts`
3. Implement handler in `src/handlers/`
4. Register tool in `src/server.ts`
5. Add unit and integration tests
6. Update documentation

### Debugging
- Use `LOG_LEVEL=debug` for verbose logging
- Structured JSON logs available in development
- Source maps enabled for stack traces
- VS Code launch configurations available

### Performance Considerations
- Response caching with configurable TTL
- Connection pooling for HTTP clients
- Rate limiting with Bottleneck library
- Target response time: <200ms

## GitHub Copilot Integration

### Configuration Files
- `.github/copilot-instructions.md` - Comprehensive project context for Copilot
- `.vscode/settings.json` - Copilot-specific VS Code settings
- `.copilotignore` - Files to exclude from Copilot suggestions
- `.vscode/launch.json` - Debug configurations for all services

### Using Copilot Effectively
- Copilot is configured with MCP protocol patterns and shipping domain knowledge
- Use descriptive comments to guide Copilot suggestions
- Leverage Copilot Chat for complex refactoring and architecture questions
- Copilot understands the monorepo structure and shared libraries

### Best Practices with Copilot
- Review all generated code for security and business logic correctness
- Validate API integrations against actual service documentation
- Test generated code thoroughly, especially error handling
- Use Copilot for boilerplate code, tests, and documentation
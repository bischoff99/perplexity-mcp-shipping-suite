# Development Guide

## Quick Start

1. **Prerequisites**
   - Node.js 18.0.0 or higher
   - pnpm 8.0.0 or higher
   - Docker (optional)
   - EasyPost API Key
   - Veeqo API Key

2. **Setup**
   ```bash
   # Clone and install
   git clone <repository-url>
   cd perplexity
   pnpm install
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your API keys
   
   # Start development
   pnpm run dev
   ```

3. **Access Points**
   - Web Interface: http://localhost:3003
   - EasyPost MCP: http://localhost:3000/health
   - Veeqo MCP: http://localhost:3002/health

## Project Architecture

This is a **TypeScript monorepo** built with **Nx** that implements a comprehensive **Model Context Protocol (MCP) shipping automation suite**.

### Technology Stack
- **Package Manager**: pnpm with workspaces
- **Build System**: Nx (21.5.2) for monorepo orchestration
- **Language**: TypeScript 5.9.2 with ESNext modules
- **Runtime**: Node.js 18+ required
- **Containerization**: Docker with multi-stage builds
- **Testing**: Jest with 70% coverage requirements

### Workspace Structure
```
perplexity/
├── apps/
│   ├── easypost/           # EasyPost MCP Server (port 3000)
│   ├── veeqo/              # Veeqo MCP Server (port 3002)
│   ├── web-dashboard/      # Next.js Dashboard (port 3003)
│   └── web-dashboard-e2e/  # E2E Tests
├── libs/
│   ├── shared/             # Common utilities, logger, validation
│   ├── mcp-client/         # MCP protocol client implementation
│   └── ui-components/      # Shared React components
└── docs/                   # Documentation
```

## Development Commands

### Core Commands
```bash
# Development
pnpm run dev                  # Start all services
pnpm run dev:easypost        # EasyPost MCP Server only
pnpm run dev:veeqo           # Veeqo MCP Server only
pnpm run dev:web             # Web Interface only

# Building
pnpm run build:libs          # Build shared libraries first
pnpm run build:apps          # Build applications
pnpm run build:all           # Build everything

# Testing
pnpm run test                # Run all tests
pnpm run test:watch          # Watch mode
pnpm run e2e                 # End-to-end tests

# Quality
pnpm run lint                # Lint all code
pnpm run typecheck           # TypeScript checking
pnpm run format              # Format code
```

### Docker Commands
```bash
# Docker development
pnpm run docker:up           # Start all services
pnpm run docker:down         # Stop services
pnpm run docker:logs         # View logs
pnpm run docker:clean        # Clean up containers

# Health checks
pnpm run health              # Check all services
```

## AI Integration

### Claude Integration
This repository is configured for Claude AI with:
- Comprehensive project context in documentation
- MCP protocol patterns and best practices
- TypeScript/Node.js coding guidelines
- Testing strategies and patterns

### GitHub Copilot
- **Configuration**: `.github/copilot-instructions.md`
- **VS Code Settings**: `.vscode/settings.json`
- **Security Exclusions**: `.copilotignore`

**Getting Started:**
```bash
# Install extensions
code --install-extension github.copilot
code --install-extension github.copilot-chat

# Open workspace
code .vscode/perplexity-mcp.code-workspace
```

### Hugging Face Integration
For AI model deployment and inference:

```bash
# Setup
pipx install huggingface_hub
huggingface-cli login

# Deploy model
./scripts/hf_deploy.sh --model mcp-shipping-model

# Deploy demo space
./scripts/hf_deploy.sh --space mcp-shipping-demo
```

## Code Quality Standards

### TypeScript Configuration
- Target: ES2022
- Module: ESNext with Node resolution
- Strict mode with all checks enabled
- Path aliases configured (@/ prefix)
- Source maps enabled for debugging

### Testing Requirements
- **Jest** for test framework
- **Nock** for HTTP mocking
- **Supertest** for integration testing
- **Coverage threshold**: 70% for all metrics
- Test files use `.test.ts` or `.spec.ts` suffix

### Code Standards
- ESLint with TypeScript plugin for linting
- Prettier for consistent formatting
- Conventional commits format
- No unused imports or variables
- Explicit return types for functions
- Comprehensive error handling with typed errors

## Environment Configuration

### Required Variables
```env
EASYPOST_API_KEY=your_easypost_api_key_here
VEEQO_API_KEY=your_veeqo_api_key_here
NODE_ENV=development
LOG_LEVEL=info
```

### Optional Variables
```env
ENABLE_CACHE=false
REDIS_URL=redis://localhost:6379
ENABLE_WEBHOOKS=true
WEBHOOK_PORT=3001
WEBHOOK_SECRET=your_webhook_secret
```

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

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clean and rebuild
pnpm run clean
pnpm install
pnpm run build:libs
```

**Port Conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003
```

**API Key Errors:**
```bash
# Verify EasyPost API key
curl -H "Authorization: Bearer YOUR_KEY" https://api.easypost.com/v2/account

# Verify Veeqo API key
curl -H "x-api-key: YOUR_KEY" https://api.veeqo.com/current_user
```

**Docker Issues:**
```bash
# Check Docker status
docker-compose ps
docker-compose logs -f
docker-compose restart
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug pnpm run dev

# Enable verbose output
DEBUG_MODE=true pnpm run dev
```

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `pnpm test`
5. Run linting: `pnpm run lint:fix`
6. Commit: `git commit -m "feat: add new feature"`
7. Push and create PR

### Commit Format
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `docs(scope): description` - Documentation
- `test(scope): description` - Tests
- `chore(scope): description` - Maintenance

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Build system working reliably
- [x] Development environment setup documented
- [x] All services start successfully locally

### Phase 2: MCP Server Completion (Weeks 2-4)
- [x] EasyPost MCP server fully functional
- [ ] Veeqo MCP server fully functional
- [ ] All API integrations tested and working

### Phase 3: Client Integration (Weeks 4-6)
- [ ] MCP client library working without errors
- [ ] Web dashboard basic functionality complete
- [ ] End-to-end workflows functional

### Phase 4: Testing & Quality (Weeks 6-8)
- [ ] Comprehensive test coverage
- [ ] Docker deployment working
- [ ] Monitoring and alerting in place

### Phase 5: Production Ready (Weeks 8-10)
- [ ] Documentation complete
- [ ] Performance optimized
- [ ] Security validated

## Dependency Management

### Current Status
- **16 open Dependabot PRs** need review
- **High Risk**: Zod v4, Express v5, MCP SDK v1.18
- **Medium Risk**: Helmet v8, Jest v30, Node.js 24
- **Low Risk**: dotenv v17, ESLint config updates

### Merge Strategy
1. **Phase 1**: Merge low-risk PRs (dotenv, ESLint configs)
2. **Phase 2**: Test and merge medium-risk PRs
3. **Phase 3**: Comprehensive testing for high-risk PRs

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [EasyPost API](https://www.easypost.com/docs/api)
- [Veeqo API](https://docs.veeqo.com/)
- [Nx Documentation](https://nx.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

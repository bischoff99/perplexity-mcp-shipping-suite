# Contributing to Perplexity MCP Shipping Suite

## Quick Start

1. Fork the repository
2. Clone: `git clone <your-fork>`
3. Install: `pnpm install`
4. Setup: `pnpm run setup`
5. Start: `pnpm run dev`

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and add tests
3. Run tests: `pnpm test`
4. Run linting: `pnpm run lint:fix`
5. Commit: `git commit -m "feat: add new feature"`
6. Push and create PR

## Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `docs(scope): description` - Documentation
- `test(scope): description` - Tests
- `chore(scope): description` - Maintenance

## Testing

- `pnpm test` - Run all tests
- `pnpm run test:watch` - Watch mode
- `pnpm run e2e` - End-to-end tests

Thank you for contributing! 🚀

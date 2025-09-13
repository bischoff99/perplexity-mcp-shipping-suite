.PHONY: help install dev build test clean docker-up docker-down health

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

setup: ## Complete setup
	pnpm install && pnpm run build:libs

dev: ## Start development
	pnpm run dev

build: ## Build all
	pnpm run build:all

test: ## Run tests
	pnpm run test

clean: ## Clean build artifacts
	pnpm run clean

docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

health: ## Check service health
	@curl -sf http://localhost:3000/health && echo "EasyPost: OK" || echo "EasyPost: FAIL"
	@curl -sf http://localhost:3002/health && echo "Veeqo: OK" || echo "Veeqo: FAIL"
	@curl -sf http://localhost:3003/health && echo "Web: OK" || echo "Web: FAIL"

quick-start: ## Quick start for new developers
	make setup && make dev

quick-test: ## Quick test run
	make test && make build

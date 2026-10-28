.PHONY: help dev build test lint format

help: ## List all targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-8s %s\n", $$1, $$2}'

dev: ## Start the dev server
	npm --prefix app run dev

build: ## Build the production server into app/build
	npm --prefix app run build

test: ## Run the unit tests once
	npm --prefix app test

lint: ## Check formatting, lint rules and types
	npm --prefix app run lint
	npm --prefix app run check

format: ## Format all files with Prettier
	npm --prefix app run format

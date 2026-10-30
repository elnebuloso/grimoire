.PHONY: help setup dev mail-catcher build test e2e storybook lint format image image-smoke admin-reset handbook agent-start agent-stop agent-reset

help: ## List all targets
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-12s %s\n", $$1, $$2}'

setup: ## Prepare a fresh clone: check Node, create app/.env with a new key, install dependencies
	scripts/setup.sh

dev: ## Start the dev server
	npm --prefix app run dev

# The e2e tests start their own on other ports, see app/playwright.config.ts.
mail-catcher: ## Receive the mails of make dev at http://localhost:8025, SMTP on port 1025 (needs Docker)
	docker run --rm --name grimoire-mail-catcher -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.31.6

build: ## Build the production server into app/build
	npm --prefix app run build

test: ## Run the unit tests and the component stories once
	cd app && npx playwright install chromium && npm test

e2e: ## Run the browser tests against the production build with a fresh database
	cd app && npx playwright install chromium && npm run test:e2e

storybook: ## Show the component catalog at http://localhost:6006
	npm --prefix app run storybook

lint: ## Check formatting, lint rules and types
	npm --prefix app run lint
	npm --prefix app run check

format: ## Format the source code with Prettier
	npm --prefix app run format

image: ## Build the Docker image grimoire:latest
	docker build --tag grimoire:latest .

image-smoke: ## Run the indexing worker and the reset script inside grimoire:latest (after make image)
	scripts/image-smoke.sh grimoire:latest

admin-reset: ## Delete the admin account after a lost password; asks for its email address
	cd app && node --env-file=.env ../scripts/reset-admin.ts

# Without --python, uv picked an interpreter for which it built zensical from source.
handbook: ## Build the handbook site into site/
	uvx --python 3.12 zensical==0.0.70 build --strict

agent-start: ## Start the agent environment on port 5174 in the background
	scripts/agent-env.sh start

agent-stop: ## Stop the agent environment
	scripts/agent-env.sh stop

agent-reset: ## Reset the agent environment's database to the fixture data
	scripts/agent-env.sh reset

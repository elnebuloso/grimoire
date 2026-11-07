.PHONY: help setup dev mail-catcher idp-mock build test benchmark benchmark-update e2e storybook lint format image image-smoke admin-grant handbook agent-start agent-stop agent-reset agent-many-sources

help: ## List all targets
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-12s %s\n", $$1, $$2}'

setup: ## Prepare a fresh clone: check Node, create app/.env with a new key, install dependencies
	scripts/setup.sh

# Node loads app/.env into the environment, where the server reads the settings of each identity
# provider; variables exported in the shell win. Not in the npm script: the agent environment
# starts that one and must not see this file.
dev: ## Start the dev server
	cd app && node --env-file-if-exists=.env node_modules/vite/bin/vite.js dev

# The e2e tests start their own on other ports, see app/playwright.config.ts.
mail-catcher: ## Receive the mails of make dev at http://localhost:8025, SMTP on port 1025 (needs Docker)
	docker run --rm --name grimoire-mail-catcher -p 1025:1025 -p 8025:8025 axllent/mailpit:v1.31.6

idp-mock: ## Serve test identity providers for make dev at http://localhost:8090/<key>, any user and claims (needs Docker)
	docker run --rm --name grimoire-idp-mock -p 8090:8080 ghcr.io/navikt/mock-oauth2-server:6.1.2

build: ## Build the production server into app/build
	npm --prefix app run build

# TEST and E2E narrow a run, e.g. TEST=--changed, TEST=src/routes/access.spec.ts,
# E2E=src/routes/theme.e2e.ts; see .claude/rules/testing-strategy.md.
# A process that runs out of memory aborts, and a crash handler set as core pattern takes seconds
# to collect its dump, even with `ulimit -c 0`; a limit of 1 byte makes the kernel skip it.
NO_CORE_DUMP := $(if $(shell command -v prlimit),prlimit --core=1,)

test: ## Run the unit tests and the component stories once (TEST=… narrows the run)
	cd app && npx playwright install chromium && $(NO_CORE_DUMP) npm test -- $(TEST)

benchmark: ## Index the four vendored documentations and compare with the baseline in app/benchmark (network on the first run only)
	cd app && BENCHMARK=1 TZ=UTC LANG=C $(NO_CORE_DUMP) npx vitest --run --project=benchmark

benchmark-update: ## Write the baseline of make benchmark anew, for an intended change
	cd app && BENCHMARK=1 BENCHMARK_UPDATE=1 TZ=UTC LANG=C $(NO_CORE_DUMP) npx vitest --run --project=benchmark --update

e2e: ## Run the browser tests against the production build with a fresh database (E2E=… narrows the run)
	cd app && npx playwright install chromium && npm run test:e2e -- $(E2E)

storybook: ## Show the component catalog at http://localhost:6006
	npm --prefix app run storybook

lint: ## Check formatting, lint rules and types
	npm --prefix app run lint
	npm --prefix app run check

format: ## Format the source code with Prettier
	npm --prefix app run format

# The release sets it to the version it tags.
GRIMOIRE_VERSION ?= 0.0.0

image: ## Build the Docker image grimoire:latest (GRIMOIRE_VERSION=… sets its version)
	docker build --build-arg GRIMOIRE_VERSION=$(GRIMOIRE_VERSION) --tag grimoire:latest .

image-smoke: ## Run the indexing worker and the grant-admin, backup and import scripts inside grimoire:latest and check its version (after make image)
	scripts/image-smoke.sh grimoire:latest $(GRIMOIRE_VERSION)

admin-grant: ## Make an existing account an admin: EMAIL=<address>, add PASSWORD=1 to set its password
	cd app && node --env-file-if-exists=.env ../scripts/grant-admin.ts $(EMAIL) $(if $(PASSWORD),--password)

# Without --python, uv picked an interpreter for which it built zensical from source.
handbook: ## Build the handbook site into site/, failing on a page missing from nav
	uv run --python 3.12 --no-project scripts/check-handbook-nav.py
	uvx --python 3.12 zensical==0.0.70 build --strict

agent-start: ## Start the agent environment on port 5174 in the background, mails at http://localhost:5825
	scripts/agent-env.sh start

agent-stop: ## Stop the agent environment
	scripts/agent-env.sh stop

agent-reset: ## Reset the agent environment's database to the fixture data
	scripts/agent-env.sh reset

agent-many-sources: ## Add 500 paused made-up sources to the agent environment; agent-reset removes them
	scripts/agent-env.sh many-sources

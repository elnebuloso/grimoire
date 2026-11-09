---
id: TASK-55
title: Separate agent environment with fixture data
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T07:07:00Z'
updated_date: '2026-10-29 18:13'
labels:
  - ops
milestone: m-0
dependencies:
  - TASK-56
references:
  - Makefile
  - app/.env.example
  - app/playwright.config.ts
  - 'https://github.com/elnebuloso/grimoire-fixture-docs'
priority: medium
type: chore
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An agent trying a change by hand today runs against the developer's own setup: `make dev` reads `app/.env` and its `DATABASE_PATH`, so an agent that resets the database or creates test projects destroys the developer's data, and a second server collides with the developer's port. The agent also has to build every state it wants to look at (an admin account, projects, sources with pages, failing syncs, dead links) through the forms first. A separate environment with known fixture data lets the agent start, reset and fill its own instance at any time, including beside local tests, without touching the developer's.

Decided with the user: the documentation for the fixture sources comes from the fixture documents repository `grimoire-fixture-docs` (https://github.com/elnebuloso/grimoire-fixture-docs, built in TASK-56), so the fixture sources sync for real instead of being seeded into the database. Only the failing state needs a source that cannot sync.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One `make` target starts the agent environment in the background on its own port, distinct from the ports of `make dev` and `make e2e`, and another stops it
- [x] #2 The agent environment uses its own database file and settings and never reads or writes `app/.env` or the database of the developer's environment
- [x] #3 One `make` target resets the agent database and fills it with the fixture data, whether the environment is running or not
- [x] #4 The agent environment, `make dev` and `make e2e` can run at the same time
- [x] #5 The fixture data and the commands are described where agents read project instructions (`.claude/rules/`), including the port and the credentials
- [x] #6 The fixture data contains an admin account and an API key with documented credentials, and projects whose sources sync from the fixture documents repository; together they cover the states the UI shows: synced with pages and snippets, never synced, failing with an error, and with dead links
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/vite.config.ts: GRIMOIRE_AGENT_DIR switches the dev server's .env directory (env.dir), SvelteKit outDir and Vite cacheDir to app/.agent/, so it never reads app/.env and does not share generated files with make dev.
2. Export hashPassword (admin/auth.ts) and hashKey (api-keys.ts) for reuse by the seed script.
3. scripts/agent-env.sh start|stop|reset: dev server on port 5174 with app/.agent/.env and app/.agent/grimoire.db, log in app/.agent/server.log; stop by the PID listening on 5174.
4. scripts/agent-seed.ts (plain node): migrate, empty all data tables and fill them in one transaction: admin agent/agent-password, API key grimoire_agent-fixture-key, sources from grimoire-fixture-docs: platform/docs and billing/docs (synced), billing/archive (missing path, fails), platform/next (yearly schedule, checked now, never synced).
5. Makefile targets agent-start, agent-stop, agent-reset; /.agent/ in app/.gitignore.
6. .claude/rules/agent-environment.md documents commands, port, credentials and fixture states.
7. Verify alongside make dev and make e2e.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Found while verifying: SvelteKit writes the settings it loaded from .env into .svelte-kit/generated/dev/env/config.js. A make dev started next to the agent server overwrote that file, and the agent server reloaded with DATABASE_PATH from app/.env. The developer's database was not written (checksum and WAL unchanged). Fix: the agent environment also gets its own outDir and Vite cacheDir. Both have to be inside app/, because the generated files import from app/node_modules, so the directory is app/.agent/ and not .agent/ at the root.

Verification:
- make agent-reset with the server stopped, then make agent-start. Within about 15 s: platform/docs 4 pages and 3 dead links, billing/docs 3 pages and 3 dead links, both without error or warnings. billing/archive fails with 'source path "archive/docs" does not exist in the repository'. platform/next has last_synced_at NULL.
- make agent-reset while the server runs: data reset, the server keeps answering.
- Login with agent/agent-password through the form returns a redirect to /admin. GET /projects with grimoire_agent-fixture-key lists billing and platform; a wrong key gets 401.
- make dev on 5173 and the agent environment ran at the same time with their own data (start pages differ). make e2e passed (9/9) while both ran. app/data/grimoire.db checksum and WAL unchanged.
- make agent-stop frees 5174. make test (296) and make lint green.

Changed after finishing: platform/next uses the schedule '0 0 30 2 *' instead of '0 0 1 1 *'. croner's nextRun returns null for 30 February, so isDue stays false once the source was checked (checked for 2027-01-01, 2028-02-29 and 2036-03-01). The source no longer syncs on 1 January; only "sync now" syncs it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
make agent-start, agent-stop and agent-reset run a separate agent environment: a dev server on port 5174 whose .env, database, generated files and Vite cache all live in app/.agent/ (switched by GRIMOIRE_AGENT_DIR in app/vite.config.ts). It never reads app/.env and runs beside make dev and make e2e. scripts/agent-seed.ts resets the database to the fixture data in one transaction, whether the server is running or not. The data is an admin agent/agent-password, the API key grimoire_agent-fixture-key, and four sources from grimoire-fixture-docs that cover the states synced (with pages, snippets and dead links), failing and never synced. .claude/rules/agent-environment.md documents commands, port, credentials and states.

Verified end to end alongside make dev and make e2e. The developer's database stayed unchanged.

Limits: the never-synced source syncs on 1 January (yearly schedule) until the next reset. The synced sources need network access to GitHub.
<!-- SECTION:FINAL_SUMMARY:END -->

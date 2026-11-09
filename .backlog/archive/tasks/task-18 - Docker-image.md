---
id: TASK-18
title: Docker image
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - ops
milestone: m-0
dependencies:
  - TASK-12
  - TASK-13
  - TASK-16
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire is operated as a single Docker image: Node plus git for syncing, one volume for the SQLite file, configuration via environment variables.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One image contains the app and `git`
- [x] #2 The SQLite file lives on a volume and survives container restarts
- [x] #3 Polling interval, database path and token encryption key are set via environment variables
- [x] #4 A `make` target builds the image
- [x] #5 Verified: container starts, a source syncs, `query` answers via HTTP and MCP
- [x] #6 The image contains `scripts/reset-admin.ts`, runnable with `node` in the container
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Dockerfile at the repo root, two stages on node:24.22.1-trixie-slim (24.22.1 is the security release engines requires): build stage npm ci + vite build; runtime stage git + ca-certificates from apt, production node_modules, app/build, scripts/reset-admin.ts with the one module it imports (app/src/lib/server/admin/auth.ts), user node, /data owned by node, DATABASE_PATH=/data/grimoire.db, no key default. .dockerignore.
2. make image target.
3. Verify with docker: start with a named volume, set up admin, project with this repository's docs/handbook as source, API key; query via HTTP and MCP (JSON-RPC over curl); restart the container and check data survives; run reset-admin.ts with docker exec -it; MIGRATE_ONLY exits 0.
4. Handbook: a page for running the image (docker run, environment, volume, proxy headers), linked in zensical.toml nav; README quick start.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-26: the image needs no migrations folder (SQL is bundled). For Kubernetes, the same image runs as init container with `MIGRATE_ONLY=true` and the same `DATABASE_PATH`; see `docs/handbook/database.md` (one instance, `Recreate`, RWO/RWOP volume).

Handoff from TASK-25: the container needs `TOKEN_ENCRYPTION_KEY` (also the init container with `MIGRATE_ONLY`); the image must not contain a default key.

Database volume: mount a directory (e.g. `/data`), not the file – SQLite keeps `-wal` and `-shm` next to it; set `DATABASE_PATH=/data/grimoire.db`. A missing directory is created on start. See `docs/handbook/database.md`.

The image needs Node 24 (built-in `node:sqlite`; the test suite also loads TypeScript directly in child processes) and `git`. The Node version is not pinned anywhere in the repo yet (no `engines`, no `.nvmrc`).

The image needs Node 24.22.1 or newer: older versions carry the Brotli decoder flaw CVE-2026-111497 (fixed in 24.22.1 by a cherry-pick, so `process.versions.brotli` still says 1.2.0; check `zlib.constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH` instead). Use a Node base image of at least that version, not the Debian `nodejs` package (bookworm and trixie are still vulnerable there).

Base image node:24.22.1-trixie-slim: 24.22.1 is 9 days old, an exception to the two-week rule because it is the security release engines requires. Runtime layout under /grimoire: app/build, production app/node_modules, app/package.json, scripts/reset-admin.ts plus app/src/lib/server/admin/auth.ts (its only import). Runs as node (uid 1000); /data is owned by node so a named volume inherits it. Image 123 MB content.
Verified with docker 29.9.1: container starts and logs the setup token; admin, project, source (this repo, docs/handbook over https) and key set up through the admin forms; the source synced inside the container; query answered over HTTP (/query) and MCP (tools/call query via JSON-RPC); after docker rm and a new container on the same volume the project and key are still there; MIGRATE_ONLY=true exits 0; without TOKEN_ENCRYPTION_KEY exit 1; reset-admin.ts refuses without a TTY and resets with docker exec -it, the server then logs 'Admin account was reset.' and a new setup token. make handbook --strict clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Dockerfile and .dockerignore at the repository root; make image builds grimoire:latest. Two stages on node:24.22.1-trixie-slim, runtime with git and ca-certificates, non-root user node, DATABASE_PATH=/data/grimoire.db, no default key. Handbook page docker.md (start, environment, volume, reset script), README quick start. Not done: publishing the image to a registry; there is no workflow for it yet.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-43
title: Set up a fresh clone with make setup
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29 18:27'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A developer starting on a fresh clone has to collect the steps from the README (section Running): `cp app/.env.example app/.env`, generate a `TOKEN_ENCRYPTION_KEY` with `openssl rand -base64 32` and write it into the file, then `npm --prefix app ci`. Miss one and `make dev` fails with an error that does not say which step is missing. Decided with the user: one `make setup` target does all of it, so a developer is ready to work in a single command.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On a fresh clone, `make setup` followed by `make dev` starts the dev server without further steps
- [x] #2 `make setup` creates `app/.env` from `app/.env.example` with a generated `TOKEN_ENCRYPTION_KEY` only when `app/.env` does not exist, and never overwrites an existing one
- [x] #3 `make setup` installs the dependencies with `npm ci`
- [x] #4 Run a second time, `make setup` changes nothing and succeeds
- [x] #5 With a Node version below the one the project requires, `make setup` stops with a message naming the required version
- [x] #6 The README names `make setup` as the first step instead of the manual commands
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/setup.sh: check Node against engines.node in app/package.json first, create app/.env from app/.env.example with a key from node:crypto only when app/.env is missing, then npm ci.
2. Makefile target setup (documented, phony) calls the script.
3. README section Running names make setup instead of the manual commands.
4. Verify on a fresh clone with an old and the required Node version.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified on a fresh clone in a scratch directory:
- With Node 24.21.0 it stops with 'grimoire needs Node 24.22.1 or newer, this is v24.21.0' and writes nothing.
- With 24.22.1 it creates app/.env with a generated key and runs npm ci.
- A second run reports 'app/.env exists, left unchanged' (checksum unchanged) and succeeds.
- make dev then serves / with 200 and redirects /admin to /admin/setup.
The key comes from node:crypto, not openssl, so setup needs nothing besides Node.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
make setup prepares a fresh clone in one command. scripts/setup.sh checks the Node version against engines.node in app/package.json and stops with a message naming the required version. It then creates app/.env from app/.env.example with a generated TOKEN_ENCRYPTION_KEY, only when app/.env does not exist yet, and runs npm ci. The README names make setup as the first step. Running it again leaves app/.env untouched. Verified on a fresh clone with Node 24.21.0 and 24.22.1, followed by make dev.
<!-- SECTION:FINAL_SUMMARY:END -->

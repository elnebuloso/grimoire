---
id: TASK-43
title: Set up a fresh clone with make setup
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29T06:59:00Z'
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
- [ ] #1 On a fresh clone, `make setup` followed by `make dev` starts the dev server without further steps
- [ ] #2 `make setup` creates `app/.env` from `app/.env.example` with a generated `TOKEN_ENCRYPTION_KEY` only when `app/.env` does not exist, and never overwrites an existing one
- [ ] #3 `make setup` installs the dependencies with `npm ci`
- [ ] #4 Run a second time, `make setup` changes nothing and succeeds
- [ ] #5 With a Node version below the one the project requires, `make setup` stops with a message naming the required version
- [ ] #6 The README names `make setup` as the first step instead of the manual commands
<!-- AC:END -->

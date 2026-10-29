---
id: TASK-43
title: Set up a fresh clone with make setup
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels:
  - ops
dependencies: []
priority: low
type: chore
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A fresh clone needs `cp app/.env.example app/.env`, a generated `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`) and `npm --prefix app ci` before `make dev` works (README, section Running). Proposed: one target doing all of it. Not decided yet whether it is wanted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The user decided whether `make setup` is wanted
- [ ] #2 If yes: `make setup` creates `app/.env` with a generated key only when it does not exist, and installs the dependencies
<!-- AC:END -->

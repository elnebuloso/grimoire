---
id: TASK-55
title: Separate agent environment with fixture data
status: To Do
assignee: []
created_date: '2026-10-29T07:07:00Z'
labels:
  - ops
dependencies: []
references:
  - Makefile
  - app/.env.example
  - app/playwright.config.ts
priority: medium
type: chore
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An agent trying a change by hand today runs against the developer's own setup: `make dev` reads `app/.env` and its `DATABASE_PATH`, so an agent that resets the database or creates test projects destroys the developer's data, and a second server collides with the developer's port. The agent also has to build every state it wants to look at (an admin account, projects, sources with pages, failing syncs, dead links) through the forms first. A separate environment with known fixture data lets the agent start, reset and fill its own instance at any time, including beside local tests, without touching the developer's.

Fixture sources point at no reachable Git server, so a sync of them fails; how the environment keeps the polling scheduler from turning the seeded states into sync errors is part of the work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One `make` target starts the agent environment in the background on its own port, distinct from the ports of `make dev` and `make e2e`, and another stops it
- [ ] #2 The agent environment uses its own database file and settings and never reads or writes `app/.env` or the database of the developer's environment
- [ ] #3 One `make` target resets the agent database and fills it with the fixture data, whether the environment is running or not
- [ ] #4 The fixture data contains an admin account and an API key with documented credentials, and projects whose sources cover the states the UI shows: synced with pages and snippets, never synced, failing with an error, and with dead links
- [ ] #5 The agent environment, `make dev` and `make e2e` can run at the same time
- [ ] #6 The fixture data and the commands are described where agents read project instructions (`.claude/rules/`), including the port and the credentials
<!-- AC:END -->

---
id: TASK-55
title: Separate agent environment with fixture data
status: To Do
assignee: []
created_date: '2026-10-29T07:07:00Z'
updated_date: '2026-10-29 17:48'
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
- [ ] #1 One `make` target starts the agent environment in the background on its own port, distinct from the ports of `make dev` and `make e2e`, and another stops it
- [ ] #2 The agent environment uses its own database file and settings and never reads or writes `app/.env` or the database of the developer's environment
- [ ] #3 One `make` target resets the agent database and fills it with the fixture data, whether the environment is running or not
- [ ] #4 The agent environment, `make dev` and `make e2e` can run at the same time
- [ ] #5 The fixture data and the commands are described where agents read project instructions (`.claude/rules/`), including the port and the credentials
- [ ] #6 The fixture data contains an admin account and an API key with documented credentials, and projects whose sources sync from the fixture documents repository; together they cover the states the UI shows: synced with pages and snippets, never synced, failing with an error, and with dead links
<!-- AC:END -->

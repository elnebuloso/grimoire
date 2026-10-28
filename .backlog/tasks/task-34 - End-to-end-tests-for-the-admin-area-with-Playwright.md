---
id: TASK-34
title: End-to-end tests for the admin area with Playwright
status: To Do
assignee: []
created_date: '2026-10-28T23:04:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-15
priority: medium
type: chore
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin area is tested through its handlers in Node, and the browser flow (session cookie, the CSRF origin check, redirects after form posts) was so far only checked by hand with curl against the built server. Once projects and sources can be managed (TASK-15) there are enough admin flows to justify end-to-end tests in a real browser. Playwright is set up with `npx sv add playwright`, run by the user (`.claude/rules/svelte-kit.md`); the tests are written against the files the CLI generates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Playwright is set up with `sv add playwright` and runs via a `make` target
- [ ] #2 Tests run against the production build with a fresh database
- [ ] #3 Covered: first setup with the token from the server log, login, logout, rejection of a wrong password, and creating a project with a source
- [ ] #4 The tests do not depend on the network or the clock
<!-- AC:END -->

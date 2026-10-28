---
id: TASK-34
title: End-to-end tests for the admin area with Playwright
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T23:04:00Z'
updated_date: '2026-10-28T23:28:00Z'
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
- [x] #1 Playwright is set up with `sv add playwright` and runs via a `make` target
- [x] #2 Tests run against the production build with a fresh database
- [x] #3 Covered: first setup with the token from the server log, login, logout, rejection of a wrong password, and creating a project with a source
- [x] #4 The tests do not depend on the network or the clock
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep the files sv generated; pin @playwright/test to 1.64.1 (newest release older than two weeks); 'test' runs the unit tests only again, 'test:e2e' runs Playwright; Chromium only.
2. playwright.config.ts: webServer builds and starts 'node build' with a fresh SQLite file in a temp directory, a fixed TOKEN_ENCRYPTION_KEY and PROTOCOL_HEADER=x-forwarded-proto (browser sends X-Forwarded-Proto: http, otherwise the CSRF check rejects every form); server output goes to a log file the tests read the setup token from.
3. src/routes/admin/admin.e2e.ts, serial: setup with the logged token, logout, wrong password, login, create a project with a source (Git URL on .invalid, the test does not wait for the sync). Replace the generated example test.
4. make e2e target; handbook or README note on how to run it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
sv add wrote the files but installed nothing; the user ran npm install with @playwright/test pinned to 1.64.1. The add-on had appended test:e2e to 'test' and put 'playwright install' (all browsers) into test:e2e; both reverted, make e2e installs Chromium only. make help now lists targets with digits (e2e).
The setup token is read from the server log, which the webServer command redirects into the run's temp directory (E2E_DIR, inherited by workers). The source points to git.invalid, so the sync started on save fails without network and the test does not wait for it. No assertion depends on time.
Verified: make e2e twice (3 passed each, fresh database), make test 227 passed, make lint clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Playwright end-to-end tests for the admin area: setup with the token from the server log, login, logout, wrong password, and creating a project with a source whose token never appears in the page. They run via make e2e against the production build with a fresh SQLite file per run and without network access in the assertions. Follow-up candidates: running make e2e in CI; temp directories of runs stay in the system temp dir.
<!-- SECTION:FINAL_SUMMARY:END -->

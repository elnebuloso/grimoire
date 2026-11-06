---
id: TASK-294
title: >-
  Tooling: script prompts, CI guards, agent seed, e2e Git server, test cost
  table
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 19:06'
labels:
  - ops
dependencies: []
priority: low
type: chore
ordinal: 356000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Small tooling items:
- `scripts/grant-admin.ts` (`readHidden`) and `scripts/import.ts` (`askHidden`) implement the same hidden prompt and have drifted: `grant-admin` keeps input after the line break and treats only DEL as backspace; `import` drops it and treats DEL and `\b`. `grant-admin` catches `SQLITE_BUSY` with a clear message; `import` ends with a stack trace on a busy database.
- CI tests on whatever Node 24 the runner caches (`engines.node` `>=24.22.1`; last run used `v24.22.2`) while the Dockerfile pins `24.22.1`; a future major would pass too.
- `app/playwright.config.ts` has no `forbidOnly`, so a committed `test.only` in the serial `manage.e2e.ts` could make CI green on a suite that hardly ran.
- `scripts/agent-seed.ts` runs migrations with its own loop and skips the sequence check, foreign keys off during rebuilds and `foreign_key_check` that `migrate()` does (`app/src/lib/server/db/migrate.ts`). Its comments are out of date: plain Node already loads `migrate.ts` (`scripts/import.ts`), and migrations no longer "change in place until 1.0". `inTransaction` does not nest, so the seed needs one migration step without its own transaction.
- `scripts/git-https-server.ts` listens on every interface during `make e2e` and accepts any credentials; both clients reach it as `localhost` (check whether `git` resolves `localhost` to `::1` before choosing the address).
- `.claude/rules/testing-strategy.md` says 74 specs and 20 story files; there are now 78 and 38, and the timings predate the redesign.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One `scripts/prompt.ts` (plain Node, relative `.ts` import) serves both scripts; `import.ts` reports a busy database like `grant-admin`; the Dockerfile copies the new file and `make image-smoke` passes
- [x] #2 CI pins `node-version` to the Dockerfile version
- [x] #3 Playwright sets `forbidOnly: !!process.env.CI`
- [x] #4 `agent-seed.ts` migrates through a step exported by `migrate.ts`, inside its single transaction; the outdated comments are gone; `make agent-reset` works
- [x] #5 The e2e Git server listens on loopback only and `make e2e` passes
- [x] #6 The cost table in `testing-strategy.md` is measured again (the file counts may be dropped)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. scripts/prompt.ts: readHidden (keeps input after the line break, DEL and \b as backspace) and isDatabaseBusy; grant-admin and import use it, import reports a busy database; Dockerfile copies it
2. CI: node-version 24.22.1 as the Dockerfile, in check and release
3. Playwright forbidOnly on CI
4. migrate.ts exports applyMigration and checkSequence; agent-seed applies the migrations in its single transaction with foreign keys off; outdated comments gone
5. e2e Git server on loopback
6. Cost table in testing-strategy.md measured again
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- localhost resolves to ::1 first inside the image (Node lookup), to 127.0.0.1 alone here and on runners; the Git server listens on 127.0.0.1 and ::1, not on every interface. make image-smoke failed with 127.0.0.1 alone and passes with both.
- make agent-reset works with the new seed; manage.e2e passes; make image-smoke passes (grant-admin, backup, import scripts).
- Cost table measured 2026-11-06; make test is now 164 s (stories twice, TASK-287), the file counts dropped from the table.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tooling: one plain-Node prompt (scripts/prompt.ts) serves grant-admin and import, and import reports a locked database instead of a stack trace; CI pins Node to the image's 24.22.1; Playwright forbids test.only on CI; the agent seed migrates through migrate.ts' own step inside its single transaction; the e2e Git server listens on loopback only (both 127.0.0.1 and ::1); the test cost table is measured again. image-smoke, agent-reset and manage.e2e pass.
<!-- SECTION:FINAL_SUMMARY:END -->

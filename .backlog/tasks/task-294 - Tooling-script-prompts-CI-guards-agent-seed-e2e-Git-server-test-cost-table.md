---
id: TASK-294
title: >-
  Tooling: script prompts, CI guards, agent seed, e2e Git server, test cost
  table
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
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
- [ ] #1 One `scripts/prompt.ts` (plain Node, relative `.ts` import) serves both scripts; `import.ts` reports a busy database like `grant-admin`; the Dockerfile copies the new file and `make image-smoke` passes
- [ ] #2 CI pins `node-version` to the Dockerfile version
- [ ] #3 Playwright sets `forbidOnly: !!process.env.CI`
- [ ] #4 `agent-seed.ts` migrates through a step exported by `migrate.ts`, inside its single transaction; the outdated comments are gone; `make agent-reset` works
- [ ] #5 The e2e Git server listens on loopback only and `make e2e` passes
- [ ] #6 The cost table in `testing-strategy.md` is measured again (the file counts may be dropped)
<!-- AC:END -->

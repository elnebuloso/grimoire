---
id: TASK-356
title: 'Tests: timeouts for specs that start the scripts as processes'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 00:36'
labels:
  - ops
dependencies: []
references:
  - app/src/lib/server/auth/auth.spec.ts
  - app/src/lib/server/db/backup-script.spec.ts
priority: medium
type: task
ordinal: 418000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`describe('scripts/grant-admin.ts', …)` in `app/src/lib/server/auth/auth.spec.ts` (around lines 715-767) and `app/src/lib/server/db/backup-script.spec.ts` start the scripts with `spawnSync(process.execPath, [script])`: a full Node start with type stripping and a `.ts` import graph each time, under vitest's default of 5 s for the `server` project (no timeout set in `app/vite.config.ts`). The first grant-admin test spawns twice and migrates a file database three times.

Measured: grant-admin first test 0.67 s idle, 1.7–2.0 s with two server runs in parallel; second test 0.34 s / 1.1–1.5 s; backup "asks for a target" 2.4 s under load. In a full `make test` at load average 9 on 4 cores both grant-admin tests failed at about 9 s and passed on a rerun – against the rule in `.claude/rules/agent-plugin-charter/base.md` that a test turning green on a rerun is broken. `sync.spec.ts`, `instance-import.spec.ts` and `import.spec.ts` already raise their timeout to 30 s for the same reason.

Suggested fix: `describe('scripts/grant-admin.ts', { timeout: 30_000 }, …)` in `auth.spec.ts` and `vi.setConfig({ testTimeout: 30_000 })` in `backup-script.spec.ts`; check other specs that spawn scripts (`grep -rn spawnSync app/src`).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every spec that starts a script as a process has a timeout of at least 30 s
- [x] #2 They pass with two `make test TEST=--project=server` runs in parallel
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. auth.spec.ts: describe('scripts/grant-admin.ts', { timeout: 30_000 }); backup-script.spec.ts: vi.setConfig({ testTimeout: 30_000 })
2. Other specs that spawn processes checked: queue.spec.ts already has its own 10 s timeout inside the test; import specs already use 30 s
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Two `make test TEST=--project=server` runs in parallel: the grant-admin and backup specs passed in both. The only failure was the out-of-memory test (60.8 s), which is TASK-355.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The specs that start the grant-admin and backup scripts as processes now have a 30-second timeout, like the other specs that start processes, instead of the 5-second default they exceeded on a loaded machine. They passed in two full server runs side by side.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-293
title: >-
  Server cleanups: one cron interpretation, instance-name placeholder, module
  edges
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 18:22'
labels:
  - sync
  - search
  - agent-api
dependencies: []
priority: low
type: chore
ordinal: 355000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Small server-side items:
- The schedule is interpreted twice: the server builds its `Cron` in `app/src/lib/server/sync/schedule.ts`, the preview below the field builds its own in `app/src/lib/schedule.ts`. The preview claims to show runs "as the sync scheduler plans them", but nothing ties the two. `nextRun` could call `upcomingRuns(…, 1)`.
- `agentInstructions` (`app/src/lib/server/agent/operations.ts`) replaces every occurrence of "grimoire" in `instructions.md` with the instance name; a future line meaning the product would be renamed too, and `$&` in `INSTANCE_NAME` is read as a replacement pattern.
- `search/query.ts` imports `redactUrl` from `sync/git.ts`, and `api-keys.ts` imports `sha256` from `admin/auth.ts`, one line each. Plain Node loads `auth.ts` from `scripts/` and the indexing child loads parts of `sync/`, so every such edge widens what must stay loadable without Vite.
- The doc comment "The slugs of every source: what any user, and any key, may read." in `api-keys.ts` sits above `sourceChoices` instead of `allSlugs`.
- `searchSnippets` in `search/query.ts` is used only by its spec.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The server schedule and the preview use one function
- [x] #2 `instructions.md` uses an explicit placeholder replaced with a function replacer
- [x] #3 `redactUrl` and `sha256` live in modules that neither search nor keys depend on beyond the helper
- [x] #4 The doc comment sits on `allSlugs`; `searchSnippets` is removed or used
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. nextRun calls upcomingRuns(…, 1) after parseSchedule, so server and preview read a schedule the same way
2. instructions.md uses {INSTANCE_NAME}, replaced with a function replacer
3. redactUrl in server/redact-url.ts, sha256 in server/sha256.ts; search, keys and the other importers use those
4. The misplaced doc comment went with allSlugs in TASK-277; searchSnippets removed, its doc moved to searchHits, the spec keeps a local helper
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- auth.ts still loads in plain Node; make agent-reset (agent-seed.ts imports sha256 from its new module) works.
- A spec checks that a name with $& is taken literally and that no placeholder is left.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Server cleanups: the scheduler's nextRun now uses the same upcomingRuns as the schedule preview; the agent instructions use an explicit {INSTANCE_NAME} placeholder replaced by a function (no $& surprises, product mentions stay); redactUrl and sha256 live in their own small modules; the unused searchSnippets is gone. Specs green, agent seed and plain-Node load checked.
<!-- SECTION:FINAL_SUMMARY:END -->

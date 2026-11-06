---
id: TASK-293
title: >-
  Server cleanups: one cron interpretation, instance-name placeholder, module
  edges
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
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
- [ ] #1 The server schedule and the preview use one function
- [ ] #2 `instructions.md` uses an explicit placeholder replaced with a function replacer
- [ ] #3 `redactUrl` and `sha256` live in modules that neither search nor keys depend on beyond the helper
- [ ] #4 The doc comment sits on `allSlugs`; `searchSnippets` is removed or used
<!-- AC:END -->

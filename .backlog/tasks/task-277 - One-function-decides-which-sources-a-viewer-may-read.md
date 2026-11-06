---
id: TASK-277
title: One function decides which sources a viewer may read
status: To Do
assignee: []
created_date: '2026-11-06 15:56'
labels:
  - agent-api
  - search
dependencies: []
priority: medium
type: task
ordinal: 339000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The read rule (a visitor reads public sources; a user or any key reads every source or the key selection, `docs/handbook/admin.md`) is written separately in five places:
- SQL for agents: `IN_SCOPE` with `scopeParameter` in `app/src/lib/server/search/query.ts`.
- TypeScript for the start page: `app/src/routes/+page.server.ts` filters `sourceStats` itself (`allSlugs(db)` when logged in, otherwise `visibility === "public"`) and passes `readable ?? "public"` to the query form.
- "Every source" twice: a key for all sources becomes the list of every slug in `api-keys.ts`, not `"all"`; `"all"` is used only by the admin preview (`admin/status.ts`).
- "Is anything public?": its own query in `agent/http.ts` decides between 401 and the public scope.
- `stats.ts` withholds `docs_url` for non-public sources inside a query shared with the admin list.

The last change of the rule (`a6318fa`, dropping private sources and owners) touched 54 files found by hand. A missed place fails quietly: the start page lists a source the agent API refuses, or the other way round. No test compares the start page filter with `IN_SCOPE`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One function returns the `SourceScope` for a viewer (visitor, logged-in user, key), next to `IN_SCOPE`
- [ ] #2 The start page, the agent API, the "anything public" check and the `docs_url` rule read that scope
- [ ] #3 A key for all sources has the scope `"all"`
- [ ] #4 A spec shows the start page and the agent API agree for a visitor, a user and a limited key
<!-- AC:END -->

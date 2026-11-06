---
id: TASK-277
title: One function decides which sources a viewer may read
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 17:46'
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
- [x] #1 One function returns the `SourceScope` for a viewer (visitor, logged-in user, key), next to `IN_SCOPE`
- [x] #2 The start page, the agent API, the "anything public" check and the `docs_url` rule read that scope
- [x] #3 A key for all sources has the scope `"all"`
- [x] #4 A spec shows the start page and the agent API agree for a visitor, a user and a limited key
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. viewerScope (visitor, user, key) and inScope beside IN_SCOPE in search/query.ts, with scopeHasSources for the 'anything public' check
2. A key for all sources has the scope 'all'; allSlugs goes
3. Start page filters with inScope(viewerScope(...)), names docs_url only where a visitor may read the source; stats returns the column as stored
4. Spec: start page and agent listing agree for a visitor and a user, and the TypeScript rule matches IN_SCOPE for a limited key
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The docs_url rule moved from the stats SQL to the start page (stats feeds admin pages too); its spec moved with it to page.spec.ts.
- allSlugs was only used by the start page and the all-sources key; removed. The misplaced doc comment above sourceChoices went with it (one item of TASK-293).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The read rule is decided by one function, viewerScope, beside IN_SCOPE, with inScope as its TypeScript form. The start page, the agent API's 'anything public?' check and the docs_url rule use it; a key for all sources now has the scope 'all'. A spec shows the start page and the agent listing agree for a visitor, a user and a limited key. Server specs and svelte-check green.
<!-- SECTION:FINAL_SUMMARY:END -->

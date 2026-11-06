---
id: TASK-258
title: 'Shared data table with search, filter and sort for every list'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 01:01'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 320000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Six tables are written inline in routes, status words come from two places, sources are named by slug in some places and by name in others, and on a phone status and actions fall off the right edge (findings U13, U19, U26). Owner decision O6: an instance holds hundreds of sources, so every list needs search, filter and sort.

Measure M11 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No table is written inline in a route; lists use `DataTable` with search, filter and sort held in the URL and loading in pages from about 100 rows
- [x] #2 Status words of sources and syncs come only from `StatusBadge`
- [x] #3 Sources appear everywhere with name and slug below (`SourceLabel`)
- [x] #4 The scope of a key is shown by `KeyScope`, shortened when long
- [x] #5 With 500 sources in the test data every list stays usable
- [x] #6 `DataTable`, `StatusBadge`, `SourceLabel`, `KeyScope`, `EmptyState` have stories per state with axe; `SourceStatsTable` is gone
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R11 (2026-11-06): search, filter, sort and page in the URL (`q`, filters, `sort`, `page`), applied on the server; search applies 300 ms after typing without reload, focus kept, history replaced; filters as selects; sort by column head with `aria-sort`; 100 rows a page with Previous/Next and "101–200 of 512". Sources: search name/slug, filter status and visibility, sort name/status/last check. Users: search email, filter role, sort email. All API keys: search name/owner, sort name/last use. Missed queries: search text, sort count/time. Duplicates, history, requests per day: DataTable without search. Start page table: DataTable with search. `StatusBadge` the one place for state words; `SourceLabel` name with slug below (KeyScope keeps slugs); `KeyScope` all or up to three slugs and "and N more" in a `<details>`; `EmptyState` sentence plus action. Spec with 500 sources; a one-off script fills the agent environment for a manual check. `SourceStatsTable`, inline tables and the phone card view go.
2. Commit 1: list query module with spec, components with stories, sources list, start page, overview, source head and history. Commit 2: users, all keys, own keys, missed queries, duplicates, requests per day.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Search, filters, sort and page are read and applied by `app/src/lib/list.ts` (`readListParams`, `listPage`, 100 rows a page, nulls last, optional `defaultSort`); the search parameter is `search`, since the start page uses `q` for its query. Lists: sources (`SOURCE_LIST` in `lib/server/source-list.ts`, also the start page), users (role filter), all API keys (name and owner), missed queries (newest first). Invitations, duplicates and the sync history use `DataTable` without search. `RequestsPerDay` keeps its small table inside the folded details of a key: a component, not a route, and nested in a cell. `sourceState` in `lib/source-state.ts` decides the state word for badge and filter. Checked by hand with 500 extra sources in the agent environment (one-off script in the scratchpad; the agent sync marked their made-up URLs as failed, which made the filter answer large), then `make agent-reset`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every list of the web UI is a `DataTable`: search, filters, sort and page stand in the URL and apply on the server, 100 rows a page, so filtered views can be linked. `StatusBadge` names the state of a source and the outcome of a sync everywhere; `SourceLabel` shows name and slug (sources list, start page, needs attention, dead links, duplicates); `KeyScope` shortens long key scopes; `EmptyState` offers the action of an empty list. `SourceStatsTable` and the inline tables are gone. Verified: `make lint`, `make test` (1044 tests, `list.spec.ts` with 500 rows), `make e2e` (28 passed), `make handbook`, by hand with 504 sources.
<!-- SECTION:FINAL_SUMMARY:END -->

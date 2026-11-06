---
id: TASK-253
title: Management layout with sidebar and a source list of its own
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 23:58'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-252
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 315000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nine management links sit in one row, quality lists mixed with administration; sources, the core of the product, have no entry and hide under "Overview" (finding U12). Chapter 10.1 of the concept groups the sidebar into Inhalte, Qualität, Zugang, System; chapter 10.3 gives sources their own list page. Owner decision O10: no further role is planned.

Measure M6 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Counters appear only for items needing action and only when above zero
- [x] #2 `/manage/sources` lists all sources with the New source action; `/manage` shows needed actions and totals without the source table
- [x] #3 Source detail pages mark "Quellen" as current
- [x] #4 Adding a sidebar entry is one entry in its data
- [x] #5 No `isAdmin` branch remains in the management layout and overview
- [x] #6 "My API keys" and "Account" are no longer in the management navigation
- [x] #7 `manage.e2e.ts` and the handbook paths (`Manage > …`) are updated
- [x] #8 The management area shows a sidebar with the groups and entries of chapter 10.1
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R9 (2026-11-06): sidebar left of the content, no collapsing, groups Overview / Content (Sources) / Quality (Dead links, Duplicate sources, Queries without results) / Access (Users, All API keys) / System (Settings); group names are headings. Counters (sources with a sync error, dead links, duplicate pairs, open invitations) only above zero, read with their meaning. Everything under `/manage/sources` marks Sources. New `/manage/sources` with the source table and "New source"; `/manage` keeps needs-attention and totals without the table (linked totals stay out). Back links of source pages lead to `/manage/sources`. Account links and the `isAdmin` branch go. Sidebar entries are data. Handbook paths, `manage.e2e.ts`, specs.
2. Counters in `manage/+layout.server.ts`; sidebar in `manage/+layout.svelte` (one use: stays in the route).
3. Move the table and its load to `manage/sources/+page.*`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sidebar in `app/src/routes/manage/+layout.svelte` as data (`groups` of entries with route, label, optional count and its description); everything under an entry's route marks it with `aria-current="true"`, Overview only exactly. Counts from `managementCounts` in `status.ts` (spec in `status.spec.ts`), loaded by the management layout. The count reads as hidden text without plural forms ("1 with a sync error", "6 found", "1 to check", "2 not yet accepted"). `/manage/sources` holds the table and "New source"; the overview load no longer sends the source list. Deleting a source and a missing source redirect to `/manage/sources`; the back link of a source page leads there. The unused `isAdmin` of the root layout is gone. e2e reach sources through the sidebar (`openSources`). Handbook paths now `Management > <group> > <entry>`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The management area has a sidebar grouped into Overview, Content, Quality, Access and System, with counters for failed sources, dead links, duplicate pairs and waiting invitations shown only above zero. Sources have their own list `/manage/sources` with "New source"; the overview keeps needs attention and totals. Account links and the admin branch left the navigation. Verified: `make lint`, `make test` (1030 tests), `make e2e` (28 passed), `make handbook`, by hand in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->

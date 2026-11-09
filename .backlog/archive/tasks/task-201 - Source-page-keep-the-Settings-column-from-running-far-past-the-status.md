---
id: TASK-201
title: 'Source page: keep the Settings column from running far past the status'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 00:17'
updated_date: '2026-10-31 02:17'
labels:
  - admin
  - impeccable
milestone: m-1
dependencies: []
priority: medium
type: enhancement
ordinal: 263000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The detector run of the Impeccable critique of `/manage` flagged `first-viewport-column-overflow` on the source page (`app/src/routes/manage/sources/[id]/+page.svelte:167`, `div.split`): at desktop width the right column (Settings, Change the slug, Delete) ran about 2.6 viewports tall (1846 px) next to a Status sheet of 584 px that fits the first screen, so the page is mostly an empty left column beside a long form. `docs/DESIGN.md` fixes the arrangement (status, history, pages and preview on the left; a 25rem column on the right with Settings, Change the slug and Delete); a change to it updates that section.

Carried out by running `/impeccable layout /manage/sources/[id]` (Impeccable skill); the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At desktop width neither column of a source page runs more than about one viewport past the other with the fixture sources of the agent environment
- [x] #2 Status and the sync error stay in the first viewport; Settings stays reachable without scrolling past unrelated content
- [x] #3 `impeccable detect` reports no `first-viewport-column-overflow` on the source page in light and dark
- [x] #4 `docs/DESIGN.md` describes the resulting layout of the source page
- [x] #5 Tests that walk the source page (`src/routes/manage/manage.e2e.ts`) pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Run via /impeccable layout. Assessment at 1440x900 with the four fixture sources: Status leads correctly, but the 25rem side column carries Settings (about 1213 px) plus the two rare, breaking actions Change the slug (about 450 px) and Delete, 1846 px in all next to a left column of 391-986 px.
Spatial thesis: left is the source as it is, ending in the danger area (Change the slug, Delete), like the foot of GitHub's settings; right is Settings alone at 25rem. DOM and stacked order stay Status, Settings, Change the slug, Delete; only the placement from 64rem changes, by grid areas (rows auto 1fr, so the danger area follows the status directly). The danger forms keep the 30rem single-form width so their text keeps a readable measure. DESIGN.md records the arrangement.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured at 1440x900 (Playwright, uncommitted app/.agent/source-layout.mjs), where the columns end: before, the right column ran 498-1455 px past the left (sources 1-4); after, the columns end at most 327 px apart (source 1: left 1811 / right 1484; 2: 1770 / 1484; 3: 1408 / 1484; 4: 1215 / 1448). The sync error of billing-archive sits at 610-657 px, Settings starts at the top of the right column. Detector: impeccable detect --scope layout through --cdp on the logged-in pages (uncommitted app/.agent/detect-source-pages.mjs) reported first-viewport-column-overflow on sources 3 and 4 in light and dark before, and no finding on any source in either scheme after. Screenshots looked at in light and dark at 1440, 1024, 800 and 390 px: two balanced columns down to 64rem, below it the old stacked order. make lint passes; make e2e E2E=src/routes/manage/manage.e2e.ts: 15 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page puts Settings alone in the 25rem right column; Change the slug and Delete follow the status in the left column, limited to the 30rem single-form width. The right column no longer runs far past the left: the columns now end at most 327 px apart (before up to 1455 px) for every fixture source at 1440x900, Status and the sync error stay in the first viewport, and Settings is at the top of its column. On narrow screens the order is unchanged (Status, Settings, Change the slug, Delete), as is the DOM and focus order. The Impeccable detector reports no first-viewport-column-overflow on any source page in light or dark. docs/DESIGN.md describes the new arrangement. make lint and the manage e2e file pass.
<!-- SECTION:FINAL_SUMMARY:END -->

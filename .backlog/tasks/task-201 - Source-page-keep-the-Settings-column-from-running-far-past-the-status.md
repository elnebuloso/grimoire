---
id: TASK-201
title: 'Source page: keep the Settings column from running far past the status'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-31 00:17'
labels:
  - admin
  - impeccable
milestone: m-2
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
- [ ] #1 At desktop width neither column of a source page runs more than about one viewport past the other with the fixture sources of the agent environment
- [ ] #2 Status and the sync error stay in the first viewport; Settings stays reachable without scrolling past unrelated content
- [ ] #3 `impeccable detect` reports no `first-viewport-column-overflow` on the source page in light and dark
- [ ] #4 `docs/DESIGN.md` describes the resulting layout of the source page
- [ ] #5 Tests that walk the source page (`src/routes/manage/manage.e2e.ts`) pass
<!-- AC:END -->

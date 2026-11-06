---
id: TASK-256
title: Source detail as header plus four sub pages
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 23:05'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-253
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 318000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The source page holds status, dead links, sync history, page list, preview, settings, slug change and delete on one page; with a preview open it is about 6000 px long and settings, slug and delete drift far down (finding U8). With hundreds of sources (owner decision O6) it is the most used management page. Chapter 10.5 of the concept splits it.

Measure M9 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source has a header (name, slug, visibility, status, documentation link, "sync now" with visible progress) and the sub pages Status (default), Seiten (with preview), Verlauf, Einstellungen
- [ ] #2 Slug change and delete sit in a separated danger zone at the end of Einstellungen
- [ ] #3 The sync progress is visible on every sub page
- [ ] #4 Old links with `#settings` and `#status` land on the matching sub page
- [ ] #5 Links from the overview and the quality lists point to the sub page where the problem is fixed
- [ ] #6 `sources.spec.ts`, `manage.e2e.ts` and the handbook are updated
- [ ] #7 The slug change shows its consequences once in full, in the confirmation dialog; above its button stands one line naming them (snippet IDs and agent URLs change). Owner decision after TASK-251, where the full text stood twice
<!-- AC:END -->

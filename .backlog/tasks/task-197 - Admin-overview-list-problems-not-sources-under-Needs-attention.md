---
id: TASK-197
title: 'Admin overview: list problems, not sources, under "Needs attention"'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
labels:
  - admin
  - impeccable
dependencies: []
priority: high
type: enhancement
ordinal: 259000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Impeccable critique of `/manage` (snapshot in `.impeccable/critique/`, 23/40) found that "Needs attention" hides problems an admin comes for. A source that is paused on purpose looks exactly like a stuck one ("never synced"), and once it has synced the overview no longer shows that polling is off. Dead links are a problem class with no entry in the list: they appear only as a ledger figure whose link is named just "6" and as unlinked counts in the table. The list is ordered by slug, so errors do not rise above warnings once there are many sources. `docs/PRODUCT.md` asks that problems surface on their own; the user chose to turn the list into a list of problems.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each item under "Needs attention" is one problem of one source: sync error, sync warnings, never synced, polling paused (per source or by "Pause all syncs"), or dead links
- [ ] #2 A paused source shows the word for paused polling and is distinguishable from a source that is stuck without having synced
- [ ] #3 A source with dead links appears with its count (e.g. "3 dead links") and links to `/manage/dead-links`
- [ ] #4 Items are ordered by severity: errors first, then warnings and dead links, then paused and never synced; within a severity by source
- [ ] #5 The dead-link count in each row of the sources table links to the dead links, and the ledger link has an accessible name that includes "dead links"
- [ ] #6 New texts exist in `app/messages/en.json` and `app/messages/de.json`; specs cover the ordering and the paused case; stories of changed components pass axe
<!-- AC:END -->

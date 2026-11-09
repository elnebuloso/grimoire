---
id: TASK-197
title: 'Admin overview: list problems, not sources, under "Needs attention"'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:50'
updated_date: '2026-10-31 00:17'
labels:
  - admin
  - impeccable
milestone: m-1
dependencies: []
priority: high
type: enhancement
ordinal: 259000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Impeccable critique of `/manage` (snapshot in `.impeccable/critique/`, 23/40) found that "Needs attention" hides problems an admin comes for. A source that is paused on purpose looks exactly like a stuck one ("never synced"), and once it has synced the overview no longer shows that polling is off. Dead links are a problem class with no entry in the list: they appear only as a ledger figure whose link is named just "6" and as unlinked counts in the table. The list is ordered by slug, so errors do not rise above warnings once there are many sources. `docs/PRODUCT.md` asks that problems surface on their own; the user chose to turn the list into a list of problems.

Carried out by running `/impeccable harden /manage` (Impeccable skill), as the Action Summary of the critique recommends; the command's playbook governs the design work, this task's acceptance criteria decide when it is done.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A paused source shows the word for paused polling and is distinguishable from a source that is stuck without having synced
- [x] #2 A source with dead links appears with its count (e.g. "3 dead links") and links to `/manage/dead-links`
- [x] #3 Items are ordered by severity: errors first, then warnings and dead links, then paused and never synced; within a severity by source
- [x] #4 The dead-link count in each row of the sources table links to the dead links, and the ledger link has an accessible name that includes "dead links"
- [x] #5 New texts exist in `app/messages/en.json` and `app/messages/de.json`; specs cover the ordering and the paused case; stories of changed components pass axe
- [x] #6 Each item under "Needs attention" is one problem of one source: sync error, sync warnings, never synced, polling paused for that source, or dead links; "Pause all syncs" stays the notice above the list
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `status.ts`: replace the per-source `SourceHealth` filter with a list of problems (`error`, `warnings`, `deadLinks`, `paused`, `neverSynced`), one per source and kind; a sync error makes "never synced" redundant; a paused source that never synced is one `paused` problem. Order by severity (error, then warnings and dead links, then paused and never synced), then slug.
2. "Pause all syncs" keeps its notice above the list instead of one item per source; AC #1 wording adjusted to that.
3. `+page.svelte`: render one item per problem; dead links link to `/manage/dead-links#source-<id>`; ledger link gets an accessible name with "dead links".
4. `SourceStatsTable.svelte`: optional snippet for the dead-link cell, used by `/manage` only (the start page is public, the dead-links page is not).
5. Messages in en and de; update `status.spec.ts`; run `--changed`, the stories of `SourceStatsTable`, `manage.e2e.ts`; check in the agent environment in light and dark.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified in the agent environment (fixture after reset), light and dark at 1280 px: items read `billing-archive` sync error, `billing-docs` 3 dead links, `platform-docs` 3 dead links, `platform-next` polling paused, never synced. Table counts and ledger link carry the accessible names "3 dead links" / "6 dead links". `status.spec.ts` covers order, paused (never synced and synced) and an error on a never-synced source; `SourceStatsTable` stories (axe included) pass; `manage.e2e.ts` and `make test TEST=--changed` pass. The never-synced-plus-error merge from TASK-198 AC #4 is already done here.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Needs attention" on `/manage` now lists problems, not sources: one item per sync error, warnings, dead links, paused polling or missing first sync, ordered by severity, then by source. `status.ts` builds the list (`problems()`); `SourceHealth` carries `paused`. Dead links get an item linking to `/manage/dead-links#source-<id>`, and the counts in the sources table (admin only, through a new `deadLinks` snippet of `SourceStatsTable`) and in the ledger are links with an accessible name. New texts in en and de. Verified with specs, stories, the manage e2e file and in the browser in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->

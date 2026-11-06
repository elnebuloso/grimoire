---
id: TASK-256
title: Source detail as header plus four sub pages
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 00:17'
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
- [x] #1 A source has a header (name, slug, visibility, status, documentation link, "sync now" with visible progress) and the sub pages Status (default), Seiten (with preview), Verlauf, Einstellungen
- [x] #2 Slug change and delete sit in a separated danger zone at the end of Einstellungen
- [x] #3 The sync progress is visible on every sub page
- [x] #4 Old links with `#settings` and `#status` land on the matching sub page
- [x] #5 Links from the overview and the quality lists point to the sub page where the problem is fixed
- [x] #6 `sources.spec.ts`, `manage.e2e.ts` and the handbook are updated
- [x] #7 The slug change shows its consequences once in full, in the confirmation dialog; above its button stands one line naming them (snippet IDs and agent URLs change). Owner decision after TASK-251, where the full text stood twice
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R11 (2026-11-06): `/manage/sources/[id]` is Status, plus `pages`, `history`, `settings`; `new` stays one form. A header on every sub page (back link, name, slug, visibility, status badge, documentation link, "Sync now" with "Syncing…" while it runs, a toast at its end) in `[id]/+layout`, with the polling of `sync-pending`. Tabs Status, Pages, History, Settings. Status as today without history and pages; Pages with the preview in place via `?preview=` and "All pages" back; History as today; Settings form as today plus a danger zone (slug change with one line of consequences, delete). Old `#settings` replaced on the client; overview links: error and paused to settings, the rest to status. Specs, e2e, handbook.
2. Move the shared load (source, status, sync pending) into `[id]/+layout.server.ts`; actions stay per sub page (`sync` with the layout header posting to the status page).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
One route `manage/sources/[id]/[[tab=tab]]` serves Status (no segment), `pages`, `history` and `settings`, and `new`; the matcher is `tab` in `app/src/params.ts` (SvelteKit 3 declares matchers there with `defineParams`; a dev server must restart to see a new one). One page keeps the actions, the header and the sync poll, so the poll survives a tab change; at its end the page data refresh and a toast says synced or failed. The status badge is `aria-live`, not `role="status"`, so it does not count as a notice of the page. Old links: `#settings` is replaced on the client, `?preview=` without a tab redirects to `pages`. Saving an existing source stays on Settings, a new one opens on Status. `TabNav` is the shared tab component (account tabs use it too). The phone-only error row of the history table is gone (desktop rule). Handbook `admin.md` names the tabs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A source opens with a head on every sub page (name, slug, visibility, state badge, documentation link, "Sync now" with "syncing…" and a toast at the end) and tabs Status, Pages, History and Settings. The preview opens within Pages with "All pages" back; Settings ends in a separate danger zone with the slug change (one line of consequences, the full text in its dialog) and delete. Old `#settings` and `?preview=` links land on the right tab; the overview links errors and paused sources to Settings. Verified: `make lint`, `make test` (1031 tests), `make e2e` (28 passed), `make handbook`, by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-16
title: 'Admin: source status and sync'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T23:34:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-8
  - TASK-15
documentation:
  - docs/konzept.md
priority: medium
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Doc authors and operators need to see whether their docs arrived and what is broken, without reading logs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Per source: last sync, commit, number of pages, snippets and tokens
- [x] #2 Sync errors and warnings are shown at the source
- [x] #3 A preview shows the snippets of a page as agents receive them
- [x] #4 Dead links are listed with the page they occur on
- [x] #5 A "Sync now" button starts a sync of the source
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/src/lib/server/admin/status.ts: sourceStatus (last check, last sync, commit, error, warnings, pages with snippet and token counts, totals, dead links with page and anchor) and previewPage, which returns what the agent operation read returns for the page (readById), so the preview is exactly what agents get.
2. Source page shows the status above the settings; each page links to ?preview=<file>, which renders the preview on the same page. Action 'sync' awaits requestSync(id, { force: true }) and shows the result.
3. Tests: status.spec.ts with index rows in an in-memory database; sync action in projects.spec.ts with the mocked requestSync; e2e: the source page shows the error of the failed sync and a Sync now button.
4. Handbook admin.md: status and preview.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-7: the "sync now" button should pass `force: true` to `syncSource`, so changed source settings (path, exclusions) take effect without a new commit.

Handoff from TASK-8: start "sync now" with `requestSync(sourceId, { force: true })` (`app/src/lib/server/sync/index.ts`); it waits behind running syncs and resolves with `{ status: unchanged | synced | failed }`.

Status, page list, dead links and preview live on the source page; the preview is ?preview=<file> on the same page and renders readById, so it is exactly what read returns. Saving a source now redirects to the source page instead of the project, so the status is visible right away.
Found while extending the e2e tests: Svelte hydration reset the username typed into login/setup before hydration finished (value={form?.username ?? ''}). Both pages now set csr = false; they are plain forms. Separate fix commit.
Verified: make test 233 passed; make e2e 3 runs in a row, 4 passed each; built server against github.com/elnebuloso/grimoire docs/handbook: Sync now indexed 3 pages, 13 snippets, 1912 tokens, preview of admin.md shows the snippets with Source:/Edit: lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page shows last check, last sync, commit, pages/snippets/tokens (total and per page), the sync error, warnings and dead links with page and section. Each page links to a preview that renders the agent operation read. 'Sync now' runs a forced sync and shows its result. Also fixed: login and setup no longer lose a username typed before hydration (csr = false). Handbook: admin.md 'Status and sync'.
<!-- SECTION:FINAL_SUMMARY:END -->

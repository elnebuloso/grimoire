---
id: TASK-182
title: Style the management pages
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 18:35'
updated_date: '2026-10-30 19:26'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-179
  - TASK-180
references:
  - app/src/routes/manage/
  - .claude/rules/ui-components.md
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 244000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The admin area is where the developer works every day, and its pages are the densest: the overview, the source detail and new source, Try a query, Queries without results, API keys, Settings and Dead links. With the frame and the components styled, the pages still need their own arrangement from the design.

`docs/design.md` gives it: the overview with the numbers ledger next to "Needs attention" (items with an error or warning edge, nested warnings quieter) and Sources in a flush sheet below; the source page with status, history, pages and preview on the left and Settings, Change the slug and Delete in a right column; API keys with the change form in an inset well and the one-time key in a dashed well. Markup that a second page needs moves into `app/src/lib/components/` with stories, as `.claude/rules/ui-components.md` asks.

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every state of every page under `/manage` matches `docs/design.md` in light and dark
- [x] #2 Markup used by more than one page lives in `app/src/lib/components/` with stories for its states
- [x] #3 No page scrolls horizontally at 390px or at 1366px width; wide tables scroll inside their own container
- [x] #4 Every text meets WCAG AA contrast in light and dark
- [x] #5 `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New components with stories, since several pages need them: `TableScroll` (the scroll container of a wide table, a focusable named region; used by `SourceStatsTable`, the sync history and Queries without results) and `DeadLinkList` (hairline rows of `file#anchor → target` in mono; source page and Dead links).
2. Overview: `PageHead`, paused notice as warning, the numbers ledger (19rem) next to "Needs attention" from 64rem (items with `--err`/`--warn` edge, slug link in mono, nested warnings quieter), Sources in a flush sheet with "New source" in its head row.
3. Source page: back link in the head; left column Status sheet ("Sync now" primary in the head row, pending notice, facts, parts below hairlines: error, warnings, dead links, history with coloured outcomes, pages, numbered snippet preview, missing/empty as warnings); right 25rem column Settings, Change the slug, Delete. New source: the Settings sheet alone, fields in two columns where there is room; branch, path and cron in mono; Save primary next to Test connection.
4. Try a query, Queries without results (flush sheet), Settings (sheet, saved notice), Dead links (one sheet per source, two side by side from 64rem).
5. API keys: created key in a sheet (status notice, the key in a dashed mono `output` in a well next to "Copy key"), keys as rows with the revoke button, the change form opening from `<details>` in an inset well, sources indented in mono; New key sheet.
6. Verify every state in light and dark at 390/1366 (overflow + axe), `make test`, `make e2e`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
New components with stories: `TableScroll` (scroll container as a focusable named region; now used by `SourceStatsTable`, the sync history and Queries without results) and `DeadLinkList` (source page and Dead links). `PageHead` from TASK-181 is used on every page here.
"New source" sits in the head row of the Sources sheet as a plain link: `docs/design.md` names no link-styled-as-button, and adding one would be a new global class.
New source: the Settings sheet alone (max 52rem), the first six fields and username/token in two columns from 48rem; inside the 25rem side column of a source they stay one column.
Inputs in the inset well of the key change form sit on `--sheet` and still rise to `--raised` on focus.
Check: overflow + axe (wcag2a/aa), light/dark, 390/1366 over: overview (default, syncs paused), source 1 with preview, preview of a missing page, sources 3 (failing) and 4 (never synced, sync pending, globally paused), new source, Try a query (empty and answered), Queries without results (empty and with two rows), Settings (default, saved), Dead links, API keys (default, create error, created with one-time key, change error, changed), source test ok, test error, save error, slug error. All pass. The agent environment was reset afterwards (`make agent-reset`).
make lint, make test (672), make e2e (18) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Arranged every page under `/manage` per `docs/design.md`: overview with the numbers ledger next to Needs attention (error/warning edges, quieter nested warnings) and Sources in a flush sheet; the source page in two columns (status, history, pages and numbered snippet preview left; Settings, Change the slug, Delete right), the new-source form alone with two-column fields; Try a query, Queries without results, Settings and Dead links in sheets; API keys with the one-time key in a dashed mono well, key rows with revoke and the change form in an inset well. Shared markup moved into `TableScroll` and `DeadLinkList` with stories. Every state checked in light and dark at 390/1366 with axe and for overflow; lint, test, e2e green.
<!-- SECTION:FINAL_SUMMARY:END -->

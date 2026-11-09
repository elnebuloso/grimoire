---
id: TASK-413
title: 'Sync: name the exclusions when they exclude every page of a source'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:52'
labels:
  - sync
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 475000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
A sync that finds no page fails instead of replacing a working index with an empty one (`prepareCheckout` in `app/src/lib/server/sync/index-source.ts`, error kind `noPage`). The error text and the hint under it (`admin_fix_no_page` / `sync_error_no_page` via `app/src/lib/sync-fix.ts`) point the admin at the source path.

### Problem
`listPages` drops the excluded files before the `listed.length === 0` check. With source path `docs` and exclusion `docs/**` (or a mistyped pattern that matches everything), the admin sees `no page could be indexed, no Markdown file below the source path "docs"`, although the folder holds hundreds of pages. The hint sends them to the path field instead of the exclusions.

### Fix
Let `listPages` also tell how many Markdown files it found before the exclusions. When files were found but all were excluded, throw a `noPage` failure whose message names the exclusions (for example `no page could be indexed, the exclusions exclude every Markdown file below the source path "docs"`). Check whether the `noPage` hint needs a second wording, and keep the texts in `app/messages/en.json` and `de.json` in line with `.claude/rules/glossary-de.md` (Ausschluss). Add a case to `app/src/lib/server/sync/index-source.spec.ts`, next to the "no Markdown file" case.

`noPage` is a repeating failure (`REPEATING_KINDS` in `app/src/lib/server/sync/sync.ts`): the same commit is not retried by polling. That is fine here, because saving changed exclusions forces a sync (`savingChanges` in `app/src/lib/server/admin/sources.ts` counts exclusions as an index change); the new message only has to send the admin to that field.

### If we skip it
An admin with a wrong exclusion looks for the error in the wrong field.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When Markdown files exist but all are excluded, the noPage error names the exclusions, not the path
- [x] #2 en and de texts follow the glossary
- [x] #3 A spec covers the all-excluded case
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. listPages returns the pages and how many it found before the exclusions
2. prepareCheckout throws a noPage failure naming the exclusions when all found pages are excluded
3. Spec in index-source.spec.ts; handbook admin.md error table
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
When Markdown files exist below the source path but the exclusions remove all of them, the sync now fails with `no page could be indexed, the exclusions exclude every Markdown file below the source path "docs"` instead of claiming the path holds no Markdown. Kind stays noPage (message prefix unchanged), so the existing hint, which already names the exclusions, applies; no new translated text was needed. Spec in index-source.spec.ts; handbook admin.md lists the new message.
<!-- SECTION:FINAL_SUMMARY:END -->

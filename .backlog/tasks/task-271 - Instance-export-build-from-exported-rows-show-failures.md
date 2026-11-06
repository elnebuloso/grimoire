---
id: TASK-271
title: 'Instance export: build from exported rows, show failures'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:55'
updated_date: '2026-11-06 16:35'
labels:
  - admin
dependencies: []
priority: high
type: bug
ordinal: 333000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`writeExport` in `app/src/lib/server/instance-export.ts` (with `realStateCopy`) serializes the whole database (pages, snippets, FTS index, sync runs), patches the WAL bytes, deserializes into a second in-memory database, deletes from ten tables, updates every non-exported column, runs `VACUUM`, serializes again and `gzipSync`s. Only the scrypt step is asynchronous. At its peak the process holds the database image two to three times, and while it runs the server answers no other request (no search, no MCP call, no login). Duration not measured.

The settings page handler (`app/src/routes/manage/settings/+page.svelte`) handles only the file or a 303 with `?export=` in the final URL. A 500 (out of memory, or a `NOT NULL` column without default in `resetToDefaults`) lands on the same page with nothing shown; a failed `fetch` throws out of the submit handler. The button simply becomes clickable again.

The import already copies rows table by table (`copyRows` in `instance-import.ts`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The export creates an empty database through the migrations and copies only the `EXPORTED_COLUMNS` of each exported table from the live database; pages, snippets and the index are never copied
- [x] #2 `resetToDefaults` and the WAL byte patch are no longer needed, or are covered by a spec on a file database
- [x] #3 The settings page shows an error for every answer that is neither the file nor a known refusal, including a network failure
- [x] #4 Existing export and import specs, and the import of `export-schema-4.grimoire-export`, still pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. writeExport takes the migrations; the copy is a new in-memory database migrated to the same schema, filled with the EXPORTED_COLUMNS of each exported table (INSERT OR REPLACE for the settings row the migrations create)
2. resetToDefaults, the WAL byte patch and VACUUM go
3. Spec: export from a file database in WAL mode with rows not yet checkpointed
4. Settings page: an answer that is neither the file nor a refusal redirect, or a failed fetch, shows export_failed in the form's error
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Peak memory is now the exported rows, not two or three images of the whole database; pages, snippets and the FTS index are never read.
- Checked by hand in the agent environment: a real export downloads; an aborted request and a 500 both show 'The export failed. …'; a passphrase mismatch still shows its refusal.
- manage.e2e (export imported on the second instance) and export/import specs pass, including export-schema-4.grimoire-export.
- The WAL item of TASK-295 is void now: the patch no longer exists, and the new spec covers a WAL file database.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The instance export no longer serializes the whole database: it migrates an empty in-memory database and copies only the exported columns of the exported tables. resetToDefaults, the WAL byte patch and VACUUM are gone; a spec exports a WAL file database. The settings page now shows an error for a network failure or any unexpected answer instead of silently re-enabling the button. Verified with export/import specs, manage.e2e and by hand in the browser.
<!-- SECTION:FINAL_SUMMARY:END -->

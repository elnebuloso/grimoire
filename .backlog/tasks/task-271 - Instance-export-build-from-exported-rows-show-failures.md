---
id: TASK-271
title: 'Instance export: build from exported rows, show failures'
status: To Do
assignee: []
created_date: '2026-11-06 15:55'
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
- [ ] #1 The export creates an empty database through the migrations and copies only the `EXPORTED_COLUMNS` of each exported table from the live database; pages, snippets and the index are never copied
- [ ] #2 `resetToDefaults` and the WAL byte patch are no longer needed, or are covered by a spec on a file database
- [ ] #3 The settings page shows an error for every answer that is neither the file nor a known refusal, including a network failure
- [ ] #4 Existing export and import specs, and the import of `export-schema-4.grimoire-export`, still pass
<!-- AC:END -->

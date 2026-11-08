---
id: TASK-399
title: 'Sync: refuse an index with no page when the source path lists no Markdown file'
status: To Do
assignee: []
created_date: '2026-11-08 19:50'
labels:
  - sync
dependencies: []
priority: high
type: bug
ordinal: 461000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). The guard "an empty index would replace the working one" in `app/src/lib/server/sync/index-source.ts` (around line 66, `if (listed.length > 0 && files.length === 0)`) and in `app/src/lib/server/sync/index-pages.ts` (around line 61, `job.pages.length > 0 && indexed.length === 0`) only fires when at least one file was listed. Cases: the authors turn `docs/` into a Git submodule (the clone leaves an empty folder), rename pages to `.markdown`, or an exclusion covers every file. The sync then replaces the live index with zero pages, records the run as synced, and shows no error or warning: every agent loses the source silently. The failure to throw exists: `SyncFailure('noPage', …)`, and `noPage` is in `REPEATING_KINDS` in `sync.ts`. Whether a source with no page at its first sync stays allowed is decided in the plan; the minimum is that a source that has pages is never emptied silently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A sync of a source that has pages, whose path now lists no Markdown file, fails with a `noPage` error and keeps the existing index
- [ ] #2 The error text names the reason (no Markdown file below the source path) so an admin can act on it; the handbook section on sync errors (`docs/handbook/admin.md`) lists it with its fix
- [ ] #3 A spec with real Git or the indexing functions covers the empty path and fails before the change
<!-- AC:END -->

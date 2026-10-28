---
id: TASK-7
title: Git sync of a source
status: To Do
assignee: []
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T20:04:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-2
  - TASK-4
  - TASK-5
  - TASK-6
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Git is the source of truth; grimoire only reads. A sync brings one source (repo, branch, one path) into the index. It speaks only Git, no provider API, so every Git server works the same. Agents must never see a half-written index, and a failed sync must not wipe what worked before. Access tokens are secrets and must never leak.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git ls-remote` is used to detect changes; an unchanged commit skips the sync
- [ ] #2 The source path is fetched with a shallow sparse clone into a temporary directory that is always removed afterwards
- [ ] #3 Include targets outside the path are fetched via `sparse-checkout add` of their directory until no new targets appear
- [ ] #4 All pages, snippets and links of the source are replaced in one transaction
- [ ] #5 A failed sync keeps the last good state active and stores the error on the source
- [ ] #6 A file that cannot be processed is skipped and stored as a warning; the rest is indexed
- [ ] #7 Exclusion patterns of the source are applied
- [ ] #8 The access token never appears in errors, warnings, logs or stored URLs
- [ ] #9 Integration test syncs a local test repository
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-4: run `resolveIncludes(raw, { path, sourcePath }, read)` (`app/src/lib/server/parsing/include.ts`) on every page before `preprocessPage`; `read` takes repo-relative paths and returns undefined for missing files. Collect `outsideSourcePath` over all pages, `git sparse-checkout add` the directories not yet checked out, rerun until nothing new appears; keep only the warnings of the last run.
<!-- SECTION:NOTES:END -->

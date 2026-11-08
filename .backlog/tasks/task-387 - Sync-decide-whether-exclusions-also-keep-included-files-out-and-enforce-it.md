---
id: TASK-387
title: 'Sync: decide whether exclusions also keep included files out, and enforce it'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:42'
labels:
  - sync
dependencies: []
priority: medium
type: task
ordinal: 449000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source's exclusions (glob patterns relative to the repository root, such as `docs/internal/**`) keep pages out of the index: only `listPages` applies them (`app/src/lib/server/sync/index-source.ts:275`). Includes (`--8<-- "file.md"`) are resolved through `read`, which is `readInside` without an exclusion check (`index-source.ts:125`, `:167-171`).

Case: exclusions `docs/internal/**`, and `docs/index.md` contains `--8<-- "docs/internal/credentials.md"`. The excluded file's text becomes part of the snippets of `index.md` and is served to every reader of the source. The comment at `index-source.ts:273-274` ("a link must not bring an excluded directory back") suggests excluded content is meant to stay out, but MkDocs itself would render the include, and grimoire indexes pages as the site renders them. The handbook describes exclusions in `docs/handbook/admin.md` (source form) and `docs/handbook/writing.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The user has decided whether an exclusion also applies to included files; the decision and its reason are in the implementation notes
- [ ] #2 If it applies: an include of an excluded file is not inserted and is reported as a warning of the source, covered by a spec in index-source.spec.ts or sync.spec.ts
- [x] #3 The handbook says what an exclusion does to includes, either way
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (user, 2026-11-08): exclusions do not apply to included files. Includes stay as the site renders them, as MkDocs does; grimoire indexes pages as the site shows them. Remaining work: the handbook says so (AC #3); AC #2 does not apply.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decided with the user: exclusions keep pages out of the index, not the files those pages include, as MkDocs renders them. The handbook's Exclusions row in admin.md now says so. AC #2 does not apply (it covered the other decision).
<!-- SECTION:FINAL_SUMMARY:END -->

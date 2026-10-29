---
id: TASK-6
title: Link resolution
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-5
documentation:
  - docs/concept.md
priority: medium
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents follow links with `read`, so relative Markdown links (`deploy.md#rollback`) must point to grimoire IDs. Recording every link also gives the admin area backlinks and dead links; a relative link that leaves the source path is broken in MkDocs as well.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Relative links are rewritten to grimoire IDs (`platform/auth-service/deploy#rollback`) in the snippet text
- [x] #2 Every resolved or dead link is returned as a record with its source page/anchor and target ID, ready for the sync to store
- [x] #3 Links to files or anchors that do not exist, and links leaving the source path, are recorded as dead
- [x] #4 External links stay unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `chunkPage` also returns `titleAnchor`, the anchor of the H1 that becomes the page title; it is no snippet, but MkDocs renders it, so links to it are valid.
2. Add `resolveLinks(pages, { project, source })` in `app/src/lib/server/parsing/links.ts`, working on all chunked pages of one source (keyed by file relative to the source path), because a target can only be checked once every page is known.
3. Per snippet: parse the content, rewrite `link` and `definition` URLs that point to a `.md` file or `#anchor` into grimoire IDs; a link to the title anchor becomes the page ID; aliases count as existing anchors. Re-stringify and recount tokens only when something changed.
4. Dead: target file missing, anchor missing, or path leaving the source path (target recorded as written). Dead links keep their text.
5. Unchanged and not recorded: URLs with a scheme, absolute paths (`/…`), links to non-Markdown files.
6. Return link records `{ file, anchor, target, dead }`, deduplicated per snippet anchor.
7. Unit tests in `links.spec.ts`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: subsections under 50 tokens are merged into their parent snippet; their anchors are kept in `Snippet.aliases` (`app/src/lib/server/parsing/chunk.ts`). A link to such an anchor (e.g. `#port`) must resolve via aliases, otherwise it is wrongly reported as dead.

ACs "stored" and "backlinks can be queried" moved to TASK-7 and TASK-2 (decided with the user): this task only produces the link records.

Not resolved, left unchanged and not recorded: absolute paths (`/deploy.md`), directory links (`guide/`), links to non-Markdown files, links inside raw HTML.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `resolveLinks(pages, { project, source })` (`app/src/lib/server/parsing/links.ts`). It runs over all chunked pages of one source and rewrites relative links and reference definitions to `.md` pages or `#anchors` into grimoire IDs in the snippet text, recounting tokens of changed snippets. Anchors of merged subsections (aliases) count as existing; a link to the H1 anchor points to the page ID, for which `chunkPage` now also returns `titleAnchor`. Missing files, missing anchors and paths leaving the source path are returned as dead link records and keep their text; external links stay unchanged. Every link comes back as `{ file, anchor, target, dead }` for the sync to store. Verified with 9 unit tests in `links.spec.ts`; `make test` (53 tests) and `make lint` pass.
<!-- SECTION:FINAL_SUMMARY:END -->

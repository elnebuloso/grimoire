---
id: TASK-4
title: Include resolution
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-3
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MkDocs pages pull shared content in with `--8<-- "file.md"`; without resolving it agents would see the directive instead of the content. Included files may themselves contain includes and may lie outside the source path, which the sync has to fetch separately. A cycle (`a.md` -> `b.md` -> `a.md`) must not hang the sync.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `--8<-- "file.md"` is replaced by the content of the file, resolved from the repository root
- [x] #2 Nested includes are resolved
- [x] #3 A file already in the current include chain is not inserted again and is reported as a warning
- [x] #4 A missing include target is reported as a warning and the rest of the page is still processed
- [x] #5 Include targets outside the source path are reported so the sync can fetch them
- [x] #6 Unit tests cover nesting, a cycle and a missing target
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add `resolveIncludes(source, page, read)` in `app/src/lib/server/parsing/include.ts`, working on raw text before `preprocessPage`. Files are read through a callback with repo-relative paths, so the sync can back it with the temporary clone and tests with a map.
2. Follow pymdownx.snippets with its default `base_path` (`.`, the build directory = repository root when `mkdocs.yml` sits there): single-line `--8<-- "file"` (quotes " or '), block format, `;` to escape or disable, indentation of the marker applied to the included lines, resolution inside code fences too (snippets is a text preprocessor).
3. Nested includes resolve from the repository root as well; a file already in the include chain is skipped with a warning; a missing target or a path leaving the repository is a warning and the marker line is dropped.
4. Return every target outside the source path in `outsideSourcePath`, so the sync can sparse-checkout its directory and run again.
5. Unit tests in `include.spec.ts`: replacement, nesting, cycle, missing target, outside source path, block format, escape, indentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-3/TASK-5: pipeline order is raw file → include resolution (this task, on raw text) → `preprocessPage` (`app/src/lib/server/parsing/preprocess.ts`) → `chunkPage` (`chunk.ts`). Resolving on raw text lets admonitions/tabs from included files be converted too.
Unverified guess: `--8<--` paths resolve from the repository root (pymdownx.snippets `base_path`); check the pymdownx docs before building on it.

Checked pymdownx.snippets docs: `base_path` defaults to `['.']`, i.e. the working directory of the build; that is the repository root when MkDocs runs there. A custom `base_path` in `mkdocs.yml` is not read (same situation as `toc.slugify`).

Not supported, reported as "not found": line selection (`file.md:4:6`), named sections (`file.md:name`), URL includes, a custom `base_path` from `mkdocs.yml`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `resolveIncludes` (`app/src/lib/server/parsing/include.ts`). It replaces pymdownx.snippets includes on raw text before `preprocessPage`: single-line and block format, `;` escape/disable, marker indentation, also inside code fences. Paths resolve from the repository root (default `base_path`), nested includes too. Files are read through a callback with repo-relative paths. Cycles, missing targets and paths leaving the repository become warnings with the page path; targets outside the source path are returned in `outsideSourcePath` for the sync. Verified with 15 unit tests in `include.spec.ts`; `make test` and `make lint` pass. Follow-up candidates: line selection and named sections.
<!-- SECTION:FINAL_SUMMARY:END -->

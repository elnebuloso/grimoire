---
id: TASK-332
title: 'Source form: refuse exclusion lines too long for matchesGlob'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:20'
labels:
  - admin
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/admin/duplicates.ts
priority: medium
type: bug
ordinal: 394000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Exclusions are stored as one glob per line (`exclusionsJson` in `app/src/lib/server/admin/sources.ts`), without a length check in `sourceProblem`. Node's `path.matchesGlob` throws "pattern is too long" for a pattern over 65,536 characters (checked: 65,536 works, 65,537 throws).

Case: source A (path empty) and source B (path `docs`) share a repository. An admin pastes a line of more than 64 KiB into A's exclusions; the save succeeds (`sourceConflict` returns early when URL and path are unchanged). From then on every `/manage/*` page runs the layout load (`app/src/routes/manage/+layout.server.ts`) → `managementCounts` → `sourceOverlaps` → `matchesGlob` in `app/src/lib/server/admin/duplicates.ts` (around lines 85-87), which throws: every management page answers 500, including A's own settings page, so the UI cannot undo it; only a database edit can. A's sync fails on the same call in `listPages` (`app/src/lib/server/sync/index-source.ts`).

Suggested fix: in `sourceProblem`, refuse at the `exclusions` field any line longer than about 1,000 characters (new message key in every `app/messages/<locale>.json`).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Saving a source with an exclusion line over the limit is refused at the exclusions field and writes nothing
- [x] #2 Normal exclusions save as before
- [x] #3 A spec covers the refusal
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: sourceProblem refuses an exclusion line over 1,000 characters at the exclusions field and accepts one of 1,000
2. sourceProblem checks every line against MAX_EXCLUSION_LENGTH; new message error_exclusion_too_long in en and de
3. The exclusions field of SourceSettingsForm is marked with markRefusal like the other fields; handbook names the limit; glossary gets "Ausschluss"
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; admin/sources.spec.ts, the route spec and the SourceSettingsForm stories pass (101 tests). make handbook passes.
- The German term "Ausschluss" was already used in de.json (field label, fix hints); added to .claude/rules/glossary-de.md as the glossary rule asks for a new term.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a source now refuses an exclusion line longer than 1,000 characters at the exclusions field, which is marked like the other fields. Before, a pasted line over 64 KiB was stored and made matchesGlob throw on every management page and every sync of the source, with no way back through the UI. Spec in admin/sources.spec.ts; the handbook names the limit.
<!-- SECTION:FINAL_SUMMARY:END -->

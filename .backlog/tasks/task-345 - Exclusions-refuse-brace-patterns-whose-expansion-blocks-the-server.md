---
id: TASK-345
title: 'Exclusions: refuse brace patterns whose expansion blocks the server'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-06 23:56'
labels:
  - admin
  - sync
dependencies: []
references:
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/admin/duplicates.ts
priority: high
type: bug
ordinal: 407000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Exclusions of a source are glob patterns tested with Node's `path.matchesGlob`, on the server thread in `app/src/lib/server/admin/duplicates.ts` (around lines 85-87, reached from the `/manage` layout through `managementCounts` → `sourceOverlaps`) and in `listPages` in `app/src/lib/server/sync/index-source.ts`. `matchesGlob` expands braces with exponential cost. Measured with Node 24.22.1, one call: `'{a,b}'` repeated 10 times (50 characters) 321 ms, 12 times 776 ms, 13 times (65 characters) 5.7 s, 16 times (80 characters) did not finish within 60 s.

TASK-332 limited an exclusion line to 1,000 characters in `sourceProblem` (`app/src/lib/server/admin/sources.ts`, `MAX_EXCLUSION_LENGTH`), which does not stop this. Case: two sources on one repository whose paths overlap (one source with an empty path, one with `docs`), and an 80-character brace line in the outer one's exclusions: every `/manage` page blocks the whole process – all users and agents – and the UI cannot undo it.

Suggested fix: in `sourceProblem`, also refuse at the `exclusions` field a line with more than 4 `{` (reuse the message key `error_exclusion_too_long` or add one, in every `app/messages/<locale>.json`; German term "Ausschluss" per `.claude/rules/glossary-de.md`). Name the limit in `docs/handbook/admin.md` next to the 1,000-character limit.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Saving a source with an exclusion line of more than 4 `{` is refused at the exclusions field and writes nothing
- [x] #2 Exclusions with up to 4 brace groups save and match as before
- [x] #3 A spec in `admin/sources.spec.ts` covers the refusal; the handbook names the limit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: an exclusion line with 5 brace groups is refused at the exclusions field; one with 4 saves
2. sourceProblem refuses a line with more than MAX_EXCLUSION_BRACES = 4 `{`; message error_exclusion_braces in en and de (worded without brace characters: Paraglide reads `{ }` as a placeholder)
3. Handbook admin.md names the limit
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Measured: 4 brace groups 1-11 ms in matchesGlob, 13 groups 5.7 s.
- The refusal spec failed before and passes after; admin and route source specs pass (96 tests); make handbook passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a source now refuses an exclusion line with more than 4 groups in curly braces, whose expansion in matchesGlob grows exponentially (13 groups took 5.7 s on the server thread, 16 did not finish in a minute); patterns with up to 4 take milliseconds. Before, such a line made every management page block the whole server. Spec in admin/sources.spec.ts; the handbook names the limit.
<!-- SECTION:FINAL_SUMMARY:END -->

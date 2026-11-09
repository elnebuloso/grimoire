---
id: TASK-99
title: 'Source page: discard an entered token without deleting the stored one'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
updated_date: '2026-10-30 03:04'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
  - app/src/lib/server/admin/form-secret.ts
  - app/src/lib/server/admin/projects.ts
  - app/src/routes/manage/projects/new/+page.svelte
priority: high
type: bug
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30 (read only, not reproduced).

On the source page (`app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte`, fields around lines 219-236) a token that was typed once rides along in the hidden `encryptedToken` field after every save or "Test access" that comes back to the form. `readFormSecret` (`app/src/lib/server/admin/form-secret.ts:33-46`) keeps using that sealed copy as long as the token field is empty and the remove checkbox is not ticked. The checkbox (`field_remove_stored_token`) is only rendered when `data.source?.hasToken`.

Results:
- On a new source (`/manage/projects/<id>/sources/new`), or an existing one without a stored token, an entered token cannot be cleared. Emptying the field does nothing, the sealed copy wins. A wrong token, or one the repository does not need, is sent with every save and test. The only way out is a reload, which loses everything else typed.
- On a source with a stored token the single checkbox drops the newly entered token and the stored one together, because `saveSource` (`app/src/lib/server/admin/projects.ts:366-368`) writes `encrypted_token = NULL` whenever `removeToken` is set. Undoing a typo leaves the source without any token.

The project wizard already handles this correctly: it shows `field_remove_entered_token` as soon as `values.encryptedToken` is set (`app/src/routes/manage/projects/new/+page.svelte:79-86`). The same round trip behaves two ways, and the broken one is on the page used more often after setup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On the source page a carried entered token can be discarded on its own whenever one is carried, also on a new source and on a source without a stored token
- [x] #2 Discarding the entered token keeps the stored token of the source unchanged
- [x] #3 Removing the stored token is a separate choice, shown only when the source has one
- [x] #4 Regression tests in `projects.spec.ts` (or the source route spec) cover both cases and fail on the old code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Give the form-secret fields a separate discard checkbox (`discardToken`) that drops only the carried sealed token; `removeToken` keeps meaning "delete the stored token".
2. Source page: show discard when a token is carried, else remove-stored when the source has one. Wizard uses the same discard field.
3. Regression tests in `projects.spec.ts` and `form-secret.spec.ts`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Remove-stored is hidden while a token is carried: saving a carried token replaces the stored one anyway, so both checkboxes at once would only be contradictory. The two new route tests fail on the old `form-secret.ts`. Browser check in the agent environment: new source, typed token, Test access -> 'Remove the entered token' shown; ticked and saved -> source stored with no token. make lint and make test (547 tests) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page now offers 'Remove the entered token' whenever a typed token is carried through the form, also on new sources and sources without a stored token; it drops only the carried token. 'Remove the stored token' is a separate field shown when the source has one and no new token is carried. The wizard uses the same discard field, so `removeToken` means the same everywhere. Covered by two route regression tests (fail on old code), a form-secret test, and a manual browser check.
<!-- SECTION:FINAL_SUMMARY:END -->

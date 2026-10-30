---
id: TASK-99
title: 'Source page: discard an entered token without deleting the stored one'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
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
- [ ] #1 On the source page a carried entered token can be discarded on its own whenever one is carried, also on a new source and on a source without a stored token
- [ ] #2 Discarding the entered token keeps the stored token of the source unchanged
- [ ] #3 Removing the stored token is a separate choice, shown only when the source has one
- [ ] #4 Regression tests in `projects.spec.ts` (or the source route spec) cover both cases and fail on the old code
<!-- AC:END -->

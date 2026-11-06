---
id: TASK-279
title: One refusal shape with field for every form action
status: To Do
assignee: []
created_date: '2026-11-06 15:57'
labels:
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 341000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Form actions name their refusal differently: `error`, `userError`, `slugError`, `problem`, `linkError`, `importError`, `pathError`, `overlap`, nested `update.error` (search `fail(` under `app/src/routes`). `ConfirmAction.svelte` handles this with a hard-coded list `["error", "userError", "slugError", "problem"]`; an action behind a `ConfirmAction` that refuses under another key leaves the dialog open with no message. No type ties actions to the list. On the source page `checkAccess` already returns `{ error, field: "path" }` and the route converts it to `pathError`.

Pages also find the invalid field by comparing translated texts:
- `account/+page.svelte` and `setup/+page.svelte` check `form?.error === m.auth_new_password_too_short({ min: MIN_LENGTH })`.
- `account/api-keys/+page.svelte` keeps `SCOPE_ERRORS`, `DATE_ERRORS` and `m.apikeys_error_name()` lists; `QueryForm.svelte` does the same for question and token; the `QueryForm` story "Invalid" passes an English literal and locks the comparison in.

The password minimum `12` is copied as a literal into `account/+page.svelte`, `invite/[token]/+page.svelte`, `setup/+page.svelte` and `login/reset/[token]/+page.svelte` (`minlength={12}`), with comments saying the browser cannot import it; `manage/settings/+page.server.ts` already passes `MIN_PASSPHRASE_LENGTH` from its load. Raising the minimum on the server makes the browser accept too short passwords and the field marking stop matching.

"Focus the first invalid field" is written by hand in five places (`QueryForm.svelte`, `account/+page.svelte`, `account/api-keys/+page.svelte`, `manage/users/+page.svelte`, the source page), and the two dialog pages each wrap `submitWithToast` in their own adapter (`submitInDialog`, `invite`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every form action refuses as `{ error: string; field?: string }`; `ConfirmAction` reads `error` without a key list
- [ ] #2 Pages mark and focus the invalid field from `field`, never by comparing message texts
- [ ] #3 The password minimum reaches the pages from their loads; no page contains the literal 12
- [ ] #4 `submitWithToast` marks and focuses the field for every form; the two dialog adapters become one option of it
- [ ] #5 The `QueryForm` story no longer depends on an English message text
<!-- AC:END -->

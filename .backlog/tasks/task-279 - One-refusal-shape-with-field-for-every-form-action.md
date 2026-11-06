---
id: TASK-279
title: One refusal shape with field for every form action
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:57'
updated_date: '2026-11-06 17:24'
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
- [x] #1 Every form action refuses as `{ error: string; field?: string }`; `ConfirmAction` reads `error` without a key list
- [x] #2 Pages mark and focus the invalid field from `field`, never by comparing message texts
- [x] #3 The password minimum reaches the pages from their loads; no page contains the literal 12
- [x] #4 `submitWithToast` marks and focuses the field for every form; the two dialog adapters become one option of it
- [x] #5 The `QueryForm` story no longer depends on an English message text
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Refusal { error, field? } type in lib/forms.ts; every fail() uses it (sources: overlap adds overlap: true and field confirmOverlap; setup's import form adds import: true)
2. sourceProblem, remoteProblem, checkAccess and an authRefusal helper return the field with the message
3. Pages and QueryForm mark fields from field; the password minimum comes from the loads
4. submitWithToast focuses the refused field after the page marked it; onsuccess gets the result, so the two dialog adapters go
5. ConfirmAction reads error only
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- submitWithToast focuses the field (first aria-invalid in the form, else the input named by field); the page still marks it, since Svelte owns the field's attributes. That is how AC #4 'marks and focuses' is read.
- The path error of the source form stays next to the field (e2e asserts #path-error, UI rule: errors at the field); the other source refusals show at the top and mark their field.
- NameField now passes extra input attributes, so the name of a new source can be marked.
- The slug change refusal carries no field: its message is shown in the dialog by ConfirmAction.
- Checked by hand: API key dialog with no sources focuses the 'Only these' radio; the source form with an empty branch focuses the branch field with its description.
- manage.e2e passes; server specs, svelte-check and the stories of QueryForm, ConfirmAction, NameField pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every form action now refuses as { error, field? }. Pages mark the invalid field from field instead of comparing translated texts, submitWithToast moves the focus there, and the two dialog adapters are gone (onsuccess receives the result). ConfirmAction reads error without a key list. The password minimum reaches account, setup, invite and reset pages from their loads. QueryForm and its story no longer depend on an English message. Verified with server specs, stories, svelte-check, manage.e2e and by hand in the browser.
<!-- SECTION:FINAL_SUMMARY:END -->

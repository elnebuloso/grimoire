---
id: TASK-346
title: 'Export: confirm the current password before writing an instance export'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:02'
labels:
  - admin
  - ops
dependencies: []
references:
  - app/src/routes/manage/settings/export/+server.ts
  - app/src/routes/manage/settings/+page.svelte
  - docs/handbook/moving.md
priority: medium
type: bug
ordinal: 408000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`POST` in `app/src/routes/manage/settings/export/+server.ts` writes the instance export (`writeExport` in `app/src/lib/server/instance-export.ts`) after checking only the passphrase (length and repetition). The export holds every source's Git access token in plain text (`decryptTokens` in `instance-export.ts`), every user's password hash and every API key hash, encrypted with the passphrase the requester chose.

Case: an admin leaves a browser open, or an admin session cookie is stolen. Whoever has it posts any 12-character passphrase twice and gets a file they can decrypt themselves, with every Git token in plain text. No other page shows a stored Git token to an admin. Linking a provider (`app/src/routes/account/link/+server.ts`) already asks for the current password for exactly this reason ("not someone who found the session open").

Suggested fix: add a current-password field to the export form on `/manage/settings` and call `checkCurrentPassword(db, getClientAddress(), session, current)` (`app/src/lib/server/auth/auth.ts`) before `writeExport`; refuse with `export=wrong-current-password` (the redirect pattern the route already uses) and a message on the settings page. An admin without a password (provider-only) sets one with a reset link first, as for linking; say so in `docs/handbook/moving.md`.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An export request without the correct current password is refused and writes no file
- [x] #2 A wrong current password counts as a failed login of the client
- [x] #3 With the correct current password the export works as before
- [x] #4 Route spec and the e2e step for the export in `manage.e2e.ts` cover it; the handbook names the requirement
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Export route: after the passphrase checks, checkCurrentPassword with the session cookie and the client address; a refusal leads back with export=wrong-current-password or export=blocked
2. Settings load maps those to a refusal at the new current-password field; the export problem uses the Refusal shape and markRefusal like the other forms
3. Specs: export.spec with a real admin session (wrong and empty current password refused, the right one downloads), settings.spec for the new field; e2e fills the current password; handbook moving.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- settings and export specs pass (9 tests); manage.e2e.ts passes (22 tests) with the current password filled in.
- A wrong current password counts as a failed login (checkCurrentPassword), so the export cannot be used to guess it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The instance export now asks for the current password of the admin before it writes the file, checked like a password change (a wrong one counts as a failed login), so an open or stolen admin session alone can no longer download every Git token in plain text. A refusal marks the new field on the settings page. Export and settings specs and the e2e export step cover it; the handbook says what an admin without a password does.
<!-- SECTION:FINAL_SUMMARY:END -->

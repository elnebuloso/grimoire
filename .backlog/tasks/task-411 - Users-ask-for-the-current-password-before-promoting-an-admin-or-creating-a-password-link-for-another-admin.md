---
id: TASK-411
title: >-
  Users: ask for the current password before promoting an admin or creating a
  password link for another admin
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:48'
labels:
  - admin
dependencies: []
priority: high
type: bug
ordinal: 473000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
The instance export (`app/src/routes/manage/settings/export/+server.ts`) writes a file that holds every source's Git access token. It asks for the admin's current password (`checkCurrentPassword` in `app/src/lib/server/auth/auth.ts`) so that someone who finds an admin's browser left logged in cannot take the tokens away. Linking an identity provider (`app/src/routes/account/link/+server.ts`) asks for the same reason.

### Problem
The same open session can get around that check without a password, in two ways, both through the actions in `app/src/routes/manage/users/+page.server.ts`:
1. Invite an address they control (`invite`), accept the invitation in another browser and set a password, then press **Promote** (`promote`, which asks for nothing). They now log in as a second admin and export with their own password.
2. Create a password link (`passwordLink`) for *another* admin. Only the own account is refused (`id === locals.user!.id`); the link is valid for 24 h and takes that admin's account over.

### Fix
Ask for the current password with `checkCurrentPassword` in `promote`, and in `passwordLink` when the target user is an admin. Both actions already run through a confirmation dialog: `ConfirmAction` (`app/src/lib/components/ConfirmAction.svelte`) on `app/src/routes/manage/users/+page.svelte` (`?/promote`, and the password-link action). `ConfirmAction` takes `children` as the form's extra fields; put a password `TextField` named `current` there, as on `app/src/routes/manage/settings/+page.svelte` (export). A refusal comes back as `fail(…, { error })` and `ConfirmAction` shows `data.error` inside the dialog (it has no per-field display); use `authMessage('wrong-current-password')` / `'blocked'`, as the export does. An admin without a password (OIDC only) cannot promote or create a link for another admin until they set one, the same rule the export already applies.

New texts: a label for the password field in the two dialogs, as keys in `app/messages/en.json` and `de.json` (German per `.claude/rules/glossary-de.md`); reuse the existing current-password label key if it fits.

Tests: `app/src/routes/manage/users/users.spec.ts` for the actions (refused without, wrong and right password; a password link for a non-admin still needs none). No e2e test covers promote today (`app/src/routes/manage/manage.e2e.ts` covers inviting); the story or e2e of the dialog only if the markup changes beyond adding the field.

Handbook: `docs/handbook/admin.md` (users section, **Make admin** and `### Password link`, around lines 302–331) must say that both ask for the admin's current password, and that an admin without a password sets one first.

### If we skip it
The password checks on export and on linking do not protect what they were built for: a found session can still reach every Git token or take over another admin.

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 promote refuses without the correct current password; the refusal shows at the password field
- [x] #2 passwordLink for an admin target refuses without the correct current password; for a non-admin target nothing changes
- [x] #3 Specs cover both refusals and the success with the right password
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ConfirmDialog/ConfirmAction: optional password field (name current) inside the dialog, rendered only while open
2. users actions: promote always, passwordLink for an admin target, checked with checkCurrentPassword
3. users.spec.ts with a real admin session; stories for the dialog; handbook admin.md
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
promote and passwordLink (for an admin target) now ask for the admin's current password via checkCurrentPassword, so an open session left behind can neither create a second admin nor take over another admin to get past the export's password check. ConfirmDialog and ConfirmAction got a `password` option: a required field `current` inside the dialog, rendered only while open (a hidden required field would fail the validity check of the button that opens the dialog; caught in the browser). A wrong password shows in the dialog (`Wrong current password.`). Tests: users.spec.ts (refusals and success with a real session), ConfirmDialog and ConfirmAction stories; checked by hand in the agent environment. Handbook admin.md updated.
<!-- SECTION:FINAL_SUMMARY:END -->

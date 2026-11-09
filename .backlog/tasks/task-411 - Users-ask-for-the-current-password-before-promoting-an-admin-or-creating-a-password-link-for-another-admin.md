---
id: TASK-411
title: >-
  Users: ask for the current password before promoting an admin or creating a
  password link for another admin
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
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
Ask for the current password with `checkCurrentPassword` in `promote`, and in `passwordLink` when the target user is an admin. Both actions already run through a confirmation dialog (`ConfirmAction`, which takes `children` as extra form fields); each gets one password field named `current`, as on `app/src/routes/manage/settings/+page.svelte` and `app/src/routes/account/+page.svelte`. A wrong password is refused at the field, as with the export. An admin without a password (OIDC only) cannot promote or create a link for another admin until they set one, the same rule the export already applies.

### If we skip it
The password checks on export and on linking do not protect what they were built for: a found session can still reach every Git token or take over another admin.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 promote refuses without the correct current password; the refusal shows at the password field
- [ ] #2 passwordLink for an admin target refuses without the correct current password; for a non-admin target nothing changes
- [ ] #3 Specs cover both refusals and the success with the right password
<!-- AC:END -->

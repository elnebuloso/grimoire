---
id: TASK-398
title: 'Users: refuse a password link for the admin''s own account'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:50'
updated_date: '2026-11-08 19:57'
labels:
  - admin
dependencies: []
priority: high
type: bug
ordinal: 460000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). The `passwordLink` action in `app/src/routes/manage/users/+page.server.ts` (around line 124) creates a link for any `id` and never compares it with `locals.user.id`; only the markup hides the button (`+page.svelte`, `{#if user.id !== data.me}`), and `docs/handbook/admin.md` ("Your own account has no such link") promises it is closed. Case: someone who finds an admin's session open sends `POST ?/passwordLink` with the admin's own id; on an instance without SMTP, or when the mail fails, the answer contains `/login/reset/<token>`. They set a new password and so pass the current-password checks meant against exactly this case: the export at `/manage/settings/export` (holds every Git access token) and linking a provider at `/account/link`. A linked provider survives the owner's next reset because `setPasswordHash` in `app/src/lib/server/auth/auth.ts` keeps identities; the owner is locked out, on a single-admin instance recoverable only with `scripts/`. With two or more admins, resetting another admin this way stays allowed by design. Fix shape: refuse the own id the way `deleteUser` refuses `self` (`app/src/lib/server/admin/users.ts`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `passwordLink` with the id of the logged-in admin creates no link and answers with a refusal, also when sent directly without the UI
- [x] #2 A password link for another user, admins included, still works as before
- [x] #3 A spec (e.g. in `app/src/lib/server/admin/users.spec.ts` or the route spec) fails before the change and passes after it
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The action answers 403 for the own id before creating anything; the page never offers it, so no message text is needed. Spec in users.spec.ts fails without the check (1 failed) and passes with it; the existing spec for another user still passes. Handbook already says the own account has no such link.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The password-link action now refuses the admin's own account with 403, so a found session can no longer set a new password and get past the password checks of export and linking. Spec added; links for other users unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->

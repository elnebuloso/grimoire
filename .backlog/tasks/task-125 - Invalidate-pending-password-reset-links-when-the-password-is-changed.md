---
id: TASK-125
title: Invalidate pending password reset links when the password is changed
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: bug
ordinal: 187000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. `resetPassword` in `app/src/lib/server/admin/password-reset.ts` (around line 93) deletes every other reset link of the user. `changePassword` in `app/src/lib/server/admin/auth.ts` (lines 245-251) deletes the other sessions but leaves `password_resets` alone. A user who sees a reset mail they did not request and changes their password on the account page as a precaution leaves the mailed link valid for up to 60 minutes; its holder can still set a new password without knowing the one just chosen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Changing the password on the account page deletes all pending reset links of that user in the same transaction
- [ ] #2 A test next to the existing `changePassword` tests shows a link issued before the change is refused afterwards
<!-- AC:END -->

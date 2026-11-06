---
id: TASK-262
title: 'Users page: tabs, invite dialog, action menu and search'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 11:02'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-251
  - TASK-258
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 324000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inviting, the most frequent action, sits below two tables; destructive and harmless actions sit side by side unranked; there is no search; "Send again" without a mail server silently invalidates the link already sent (findings U21, U22).

Measure M15 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users and invitations are two tabs; "invite a user" is the primary action and opens a dialog
- [x] #2 Rare and destructive actions sit in a per-row `ActionMenu`
- [x] #3 Users can be searched by email; each row shows the number of keys, linked to the filtered key list
- [x] #4 Unlinking an identity says when it is the user's only way to log in
- [x] #5 Without a mail server the re-send action is called "create a new link" and asks before invalidating the old one
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06, go):
1. Tabs Users and Invitations on /manage/users, ?tab=invitations; the invitations tab shows the count of open invitations.
2. Primary action "Invite user" above both tabs opens a dialog; mailed: toast and close; without mail or on a failed mail the dialog shows the link once. The form at the bottom goes.
3. Users table: email, role, sign-in, Keys (count linked to /manage/api-keys?owner=<email>), actions; search and role filter stay.
4. New ActionMenu per row (native popover like UserMenu): promote/demote, password link, delete (red, last); each opens its confirmation.
5. Remove of an identity stays at the identity; when it is the only way to log in, the confirmation says so; not prevented.
6. Invitations: "Send again" with a mail server, "Create new link" without; both confirm; without mail the new link shows once.
7. Withdraw stays a button.
8. Refusals (last admin, self) show in the confirmation.
9. Stories for ActionMenu; Escape and focus by hand; e2e moves to dialog and menu.
The page gets only mailConfigured: mailer() !== undefined.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. ActionMenu keeps the confirmation dialogs of its actions inside the popover: the menu stays open behind a dialog and closes when it closes (close captured), else the dialog would vanish with it. Checked by hand: refusal shown in the dialog, Escape closes dialog and menu, focus back on the menu button. axe found visible labels missing from accessible names (Password link, Make admin, Remove admin role, Send again); the *_named messages now contain the visible text. The resend action answers resent: true so its link shows on the Invitations tab, not in the invite dialog. The fillBeforeHydration e2e helper went with the plain invite form (dialogs need JavaScript).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The users page has tabs Users and Invitations (?tab=invitations); Invite user opens a dialog that mails the invitation or shows its link once. Rare and destructive actions moved into a per-row ActionMenu; each row counts the user's keys, linked to the filtered key list. Removing a user's only login method says so; without a mail server re-sending is called Create new link. Handbook updated. make lint, make test (1064), make e2e (28) and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-262
title: 'Users page: tabs, invite dialog, action menu and search'
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
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
- [ ] #1 Users and invitations are two tabs; "invite a user" is the primary action and opens a dialog
- [ ] #2 Rare and destructive actions sit in a per-row `ActionMenu`
- [ ] #3 Users can be searched by email; each row shows the number of keys, linked to the filtered key list
- [ ] #4 Unlinking an identity says when it is the user's only way to log in
- [ ] #5 Without a mail server the re-send action is called "create a new link" and asks before invalidating the old one
<!-- AC:END -->

---
id: TASK-251
title: Replace confirm() with a confirmation dialog in three levels
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 20:57'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 313000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Confirmations follow no rule: granting the admin role and re-sending an invitation (which invalidates the previous link) ask nothing, removing the role asks; unlinking one's own identity asks nothing, an admin unlinking it asks; switching a source to `public` asks nothing, changing the slug requires typing it. Confirmations are native `confirm()` dialogs without the product's styling or a consequence text (findings U5, U22; levels in chapter 12.3 of the concept).

Measure M4 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No `confirm()` remains in the code
- [ ] #2 Level 1 actions ask in a `ConfirmDialog` with a consequence sentence and a button named after the action: revoke key, withdraw invitation, create a new invitation link, grant or remove the admin role, unlink an identity (own and by an admin), delete a user, switch a source to `public`
- [ ] #3 Level 2 actions require typing the source slug: delete a source, change the slug; `SlugChangeForm` is replaced
- [ ] #4 `Dialog` and `ConfirmDialog` have stories for each level, cancel, wrong and right input, with axe
<!-- AC:END -->

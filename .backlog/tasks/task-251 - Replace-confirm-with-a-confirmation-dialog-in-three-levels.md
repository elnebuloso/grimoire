---
id: TASK-251
title: Replace confirm() with a confirmation dialog in three levels
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 21:51'
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
- [x] #1 No `confirm()` remains in the code
- [x] #2 Level 1 actions ask in a `ConfirmDialog` with a consequence sentence and a button named after the action: revoke key, withdraw invitation, create a new invitation link, grant or remove the admin role, unlink an identity (own and by an admin), delete a user, switch a source to `public`
- [x] #3 Level 2 actions require typing the source slug: delete a source, change the slug; `SlugChangeForm` is replaced
- [x] #4 `Dialog` and `ConfirmDialog` have stories for each level, cancel, wrong and right input, with axe
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `Dialog` (native modal `<dialog>`: Escape, backdrop click, cancel close) and `ConfirmDialog` (title, consequence, cancel and named confirm button, optional typed slug that unlocks the confirm button, busy and error state; submits a form by id or calls `onconfirm`).
2. `ConfirmAction`: form with hidden inputs or visible fields, trigger button, `ConfirmDialog`; `use:enhance` through `submitWithToast`, closes on success, shows a refusal in the dialog. Replaces `ConfirmForm` and `SlugChangeForm`.
3. Level 1 on: revoke key (own, all), withdraw, resend, grant and remove the admin role, unlink (own, admin), delete user. Level 2 on: delete source (server checks the typed slug too), change slug.
4. Saving a source that becomes `public` (new or switched from internal) asks first with `ConfirmDialog` and `onconfirm`.
5. Split the `*_question` messages into title and consequence, en and de; remove the unused ones.
6. Stories for `Dialog`, `ConfirmDialog`, `ConfirmAction` with axe; specs for the delete check; e2e selectors; try every action in the agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. `ConfirmAction` (form, trigger, `ConfirmDialog`) replaces `ConfirmForm` and `SlugChangeForm`; `submitWithToast` got `onsuccess` and `onfailure`, so a refusal (last admin, last way to log in, slug taken) stays in the dialog instead of the page. Promote and resend are level 1 now; resend asks with and without a mail server, since the old link stops working either way (owner agreed). Saving a source that becomes public, new or switched from internal, asks first and then submits the same save again. Deleting a source checks the typed slug on the server too (new spec); the old `*_question` messages are split into title and consequence.
Checked by hand in the agent environment: dialog text and focus on Cancel, Escape, click beside the box, promote, demote, last-admin refusal in the dialog, delete user, revoke key, resend and withdraw, public save cancelled and confirmed, no dialog when already public, slug change locked until typed, delete source with typed slug. Not by hand: own unlink and an admin unlinking an identity (covered by `manage.e2e.ts`).
make lint, make test (997), make e2e (28) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every confirmation is a Svelte dialog now; `confirm()` is gone. Level 1 (consequence sentence, named button, focus on Cancel): revoke key, withdraw and resend invitation, grant and remove the admin role, unlink an identity, delete a user, save a source as public. Level 2 (type the slug, button locked until it matches; checked on the server for deleting): delete a source, change the slug. A refusal shows in the dialog, success closes it and shows the toast. New components `Dialog`, `ConfirmDialog`, `ConfirmAction` with stories; `ConfirmForm` and `SlugChangeForm` removed. `Dialog` is ready for the key and invitation dialogs of TASK-261 and TASK-262.
<!-- SECTION:FINAL_SUMMARY:END -->

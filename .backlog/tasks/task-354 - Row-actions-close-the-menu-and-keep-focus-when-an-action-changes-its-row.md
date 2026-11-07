---
id: TASK-354
title: 'Row actions: close the menu and keep focus when an action changes its row'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:24'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/components/ConfirmAction.svelte
  - app/src/lib/components/ActionMenu.svelte
  - app/src/routes/manage/users/+page.svelte
priority: medium
type: bug
ordinal: 416000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Confirmed row actions are a `ConfirmAction` (`app/src/lib/components/ConfirmAction.svelte`, around lines 44-48) inside the row's `ActionMenu` popover (`app/src/lib/components/ActionMenu.svelte`, around lines 303-312); `ActionMenu` stays open behind the dialog and closes on the dialog's `close` event (see `.claude/rules/memory.md`, UI).

Case (reproduced in the agent environment): on `/manage/users`, "Make admin" for `user@example.com`, confirm. The toast is right, but focus lands on `BODY` and the menu stays open, now showing "Remove admin role / Password link / Delete". Demoting does the same. Cause: the refresh in `submitWithToast` (`app/src/lib/forms.ts`) re-renders `{#if isAdmin(user)}` in `app/src/routes/manage/users/+page.svelte` (around lines 164-216), which destroys the `ConfirmAction` and its `<dialog>` before `onsuccess` sets `open = false`; the dialog leaves the DOM without a `close` event, so the menu is not hidden, and the button focus should return to is gone. From reading, the same happens whenever a row disappears: delete user, revoke key, withdraw invitation, unlink an identity.

Suggested fix: make promote/demote one `ConfirmAction` whose action, labels and texts switch on `isAdmin(user)`, so it survives the refresh and closes normally; in `ConfirmAction`, when the form is no longer connected after success, close the surrounding menu and move focus to a stable element (the `<main>` / skip-link target). Check each row action in the browser; the Storybook notes in `memory.md` say popover closing and focus must be checked in the real browser.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After promoting or demoting a user, the menu is closed and focus is on a sensible element, not the body
- [x] #2 After an action that removes its row (delete user, revoke key, withdraw invitation, unlink), focus is not lost
- [ ] #3 Checked in the agent environment in light and dark; the e2e steps that use these actions still pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ConfirmAction remembers the popover it sits in and its trigger before the action posts; when its form is no longer in the page after the action, it closes that menu if it is still there and moves focus to the trigger, or to <main> when the row is gone
2. AppShell: <main> gets tabindex=-1 so it can take focus (the skip link benefits), without a focus ring
3. Check in the agent environment: promote and demote user@example.com, revoke a key
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- General fix in ConfirmAction instead of one combined promote/demote action: it covers every action whose form the refresh replaces or removes.
- Agent environment (Playwright): after Make admin and after Remove admin role the menu is closed and focus is on the row's Actions button; after revoking a key its row is gone and focus is on <main>. Agent environment reset afterwards. ConfirmAction, ActionMenu and AppShell stories pass (20 tests).
- Dark scheme not looked at separately: no style changed apart from removing the focus ring of <main>.
<!-- SECTION:NOTES:END -->

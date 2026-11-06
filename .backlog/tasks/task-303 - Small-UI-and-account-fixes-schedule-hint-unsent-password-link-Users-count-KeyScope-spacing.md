---
id: TASK-303
title: >-
  Small UI and account fixes: schedule hint, unsent password link, Users count,
  KeyScope spacing
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 19:53'
updated_date: '2026-11-06 20:00'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 365000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Four small findings from the audit run:
- `app/src/lib/components/ScheduleField.svelte` sets `aria-describedby` to its hint, then spreads `...input`; when a page marks the field invalid (`aria-describedby` pointing to the error), the hint drops out, so a screen reader no longer reads the cron explanation.
- The `passwordLink` action in `app/src/routes/account/+page.server.ts` answers with an error when `mail.send` returns false, but the issued reset link stays and counts against the 3 links per hour of the address (`requestPasswordReset` in `app/src/lib/server/auth/password-reset.ts`): retrying after a mail failure gets the user blocked without ever receiving a link.
- The sidebar count next to **Users** (`app/src/routes/manage/+layout.svelte`) counts pending invitations but links to the Users tab, not `/manage/users?tab=invitations`.
- Unchecked: `KeyScope` with more than three sources renders `<code>…</code>,` inside an `{#each}`; whitespace trimming may drop the space between the slugs (story "Many sources, shortened").
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An invalid ScheduleField points to both the error and its hint
- [x] #2 A password link whose mail failed is withdrawn and does not count against the limit; a spec with send resolving false covers it
- [x] #3 The Users count links to the invitations tab while invitations are pending
- [x] #4 KeyScope checked in its story; if the space is missing it is fixed, otherwise the check is recorded in the task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ScheduleField joins a description the page passes with its own hint
2. withdrawPasswordReset deletes an unsent link and gives back its attempt for the address (attemptLimit.giveBack); the account page uses it when the mail fails, the forgot page once its unawaited send reports failure
3. The Users count in the sidebar links to ?tab=invitations while invitations are pending
4. KeyScope: assert the summary text in its story, fix the spacing if it fails
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Each point started with a failing check: a ScheduleField story (hint lost), the password-reset spec (link still valid, limit used up), the KeyScope story (text read 'auth,billing-docs,cli,and 3 more'). The Users link is checked in manage.e2e after an invitation.
- The forgot page withdraws too, after its send resolves: it does not await the mail, so the answer takes no longer for a known address.
- The client's own request count stays: it guards against flooding, whatever the mail did.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An invalid ScheduleField now points to both the error and its hint; a password link whose mail failed is withdrawn and no longer counts against the address's 3 links an hour (account page and forgot page); the Users count leads to the invitations tab while any are pending; KeyScope's shortened list had lost its spaces ('auth,billing-docs,cli,and 3 more') and is fixed. Stories, specs and manage.e2e cover each.
<!-- SECTION:FINAL_SUMMARY:END -->

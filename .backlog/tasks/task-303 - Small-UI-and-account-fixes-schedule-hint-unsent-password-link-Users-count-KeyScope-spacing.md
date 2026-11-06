---
id: TASK-303
title: >-
  Small UI and account fixes: schedule hint, unsent password link, Users count,
  KeyScope spacing
status: To Do
assignee: []
created_date: '2026-11-06 19:53'
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
- [ ] #1 An invalid ScheduleField points to both the error and its hint
- [ ] #2 A password link whose mail failed is withdrawn and does not count against the limit; a spec with send resolving false covers it
- [ ] #3 The Users count links to the invitations tab while invitations are pending
- [ ] #4 KeyScope checked in its story; if the space is missing it is fixed, otherwise the check is recorded in the task
<!-- AC:END -->

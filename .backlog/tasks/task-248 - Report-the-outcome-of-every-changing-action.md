---
id: TASK-248
title: Report the outcome of every changing action
status: To Do
assignee: []
created_date: '2026-11-05 20:45'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some actions confirm what they did (settings saved, slug changed, password changed), others end silently: saving or deleting a source, revoking a key, withdrawing an invitation, granting the admin role. After saving a source the page only says a sync is queued, even when only the description changed. Admins have to inspect the result to know whether an action took effect (finding U4 in the concept, chapter 12.3 "Rückmeldung").

Measure M1 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every form action that changes data ends with a status message that names the affected item (e.g. the key or source name) and is visible after the redirect
- [ ] #2 The message covers at least: password change, linking and unlinking an identity, creating, changing and revoking a key, creating, saving, syncing, renaming and deleting a source, inviting, re-sending and withdrawing an invitation, granting and removing the admin role, unlinking a user's identity, deleting a user, pausing syncs, export
- [ ] #3 Saving a source says that a sync was started only when the change actually triggers one
- [ ] #4 A `FlashMessage` component with stories (each state, axe) carries the message
- [ ] #5 Field errors stay in the form next to the field, as today
<!-- AC:END -->

---
id: TASK-225
title: API keys per user on the account page
status: To Do
assignee: []
created_date: '2026-11-03 00:30'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-223
references:
  - app/src/routes/manage/api-keys/
  - app/src/routes/account/
priority: high
type: feature
ordinal: 287000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every user is to create keys for their own tools without waiting for an admin; the admin keeps an overview and can stop a leaked key. Keys otherwise behave as today: name, all sources or a selection, optional expiry, last use.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every user creates, edits and revokes any number of their own keys on `/account`
- [ ] #2 A key covers all sources or a selection, chosen from the sources its owner may read
- [ ] #3 Admins list every key under `/manage/api-keys` with name, owner and last use, and can revoke any key; only the owner edits one
- [ ] #4 A user never sees or changes another user's keys
- [ ] #5 Route specs cover owner, other user and admin
<!-- AC:END -->

---
id: TASK-89
title: 'API keys: last use, editable scope and optional expiry'
status: To Do
assignee: []
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:02'
labels:
  - admin
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/routes/manage/api-keys/+page.svelte
priority: medium
type: feature
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The key list shows only name, scope and creation date. Nobody can tell which keys are still in use and which can be revoked, changing the projects a key sees means revoking it and handing out a new one to every agent that uses it, and a key handed out for a trial stays valid forever.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every key records when it was last used to authenticate a request, and the list shows it ("never" for unused keys)
- [ ] #2 Recording the last use does not write to the database on every request (at most once per key per minute, or a similar bound)
- [ ] #3 The scope of an existing key (all projects or a selection) can be changed without changing the key itself
- [ ] #4 A key can get an optional expiry date; an expired key is rejected like an unknown one and shown as expired in the list
- [ ] #5 Tests cover last-use recording, scope change and expiry
<!-- AC:END -->

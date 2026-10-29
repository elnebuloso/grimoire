---
id: TASK-54
title: Login action on every page while logged out
status: To Do
assignee: []
created_date: '2026-10-29T06:57:00Z'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/+layout.svelte
  - app/src/routes/+page.svelte
priority: medium
type: enhancement
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nothing in the UI leads to `/admin/login`: the public start page has no link to it, so the admin has to know the URL and type it. Logging in should be one click from wherever the admin is.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page shown to a visitor who is not logged in offers a login action that leads to `/admin/login`
- [ ] #2 While logged in, the same place offers the way to the admin area instead of the login action
- [ ] #3 Without an admin account yet, the action still leads on to setup, as `/admin/login` does today
- [ ] #4 The action works without JavaScript
- [ ] #5 An e2e test checks the login action on the start page while logged out and its replacement while logged in
<!-- AC:END -->

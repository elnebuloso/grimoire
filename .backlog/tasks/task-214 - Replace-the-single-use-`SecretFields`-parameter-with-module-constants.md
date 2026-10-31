---
id: TASK-214
title: Replace the single-use `SecretFields` parameter with module constants
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
labels:
  - admin
milestone: m-1
dependencies: []
priority: low
type: chore
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/admin/form-secret.ts` (~lines 3-20) defines the interface `SecretFields` (`entered`, `sealed`, `discard`, `remove`) so the field names of a form secret can vary, but its only value is `SOURCE_TOKEN_FIELDS`. The project allows an abstraction only once a second use exists; until then, readers have to go through an extra layer to find four field names.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source token field names are plain constants in `form-secret.ts`, and the `SecretFields` interface is gone
- [ ] #2 Source form tests that carry, discard and remove the token still pass
<!-- AC:END -->

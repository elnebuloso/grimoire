---
id: TASK-161
title: Check slug format and required names in the schema
status: To Do
assignee: []
created_date: '2026-10-30 15:32'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 223000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The slug format (lowercase letters, digits, single hyphens, at most 40 characters) and the required source name are checked only by the application. A row written past it, by a script or a future import, can produce IDs and URLs agents cannot use.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `sources.slug` has a `CHECK` matching the rule of `isSlug` in `app/src/lib/slug.ts`
- [ ] #2 `sources.name` is required and not empty
- [ ] #3 Tests show that an invalid slug and an empty name are refused by the database
<!-- AC:END -->

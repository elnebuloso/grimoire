---
id: TASK-161
title: Check slug format and required names in the schema
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 15:32'
updated_date: '2026-10-30 15:46'
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
- [x] #1 `sources.slug` has a `CHECK` matching the rule of `isSlug` in `app/src/lib/slug.ts`
- [x] #2 `sources.name` is required and not empty
- [x] #3 Tests show that an invalid slug and an empty name are refused by the database
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`sources.slug` has a CHECK equal to `isSlug` (1–40 characters of `a-z0-9-`, no leading, trailing or double hyphen); `sources.name` has no default and must not be blank. Raw inserts in tests and `scripts/image-smoke.sh` give a name. Verified: a table test compares the schema with `isSlug` for 13 slugs, a test refuses empty and blank names; `make lint` clean, `make test` 636/636, `make e2e` 18/18, `make agent-reset` passes. `make image-smoke` (needs Docker) was not run.
<!-- SECTION:FINAL_SUMMARY:END -->

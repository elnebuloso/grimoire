---
id: TASK-175
title: Drop the 1.0 schema-update section from the database handbook page
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:48'
labels: []
milestone: m-0
dependencies: []
priority: low
type: docs
ordinal: 237000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The section "Schema updates" in `docs/handbook/database.md` begins "From `1.0.0` on" and describes behaviour no released version has. For a reader of a 0.x release that is a roadmap promise, which `.claude/rules/writing-the-handbook.md` keeps out of user docs, and the section above it already says 0.x has no update path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `docs/handbook/database.md` describes only behaviour of the current 0.x releases
- [x] #2 `make handbook` passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Drop "Schema updates" from `docs/handbook/database.md`
2. Note in `.claude/rules/until-v1.md` that the section comes back with 1.0
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The section "Schema updates", which described behaviour from `1.0.0` on, is gone from `docs/handbook/database.md`; the page now describes only 0.x, where "Updating from a 0.x release" already says there is no update path. `.claude/rules/until-v1.md` notes that the section returns with 1.0 and where its last text is. `MIGRATE_ONLY` stays in `docker.md`, since the variable exists in 0.x too. Verified: `make handbook` strict, no issues.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-195
title: Release 1.0.0
status: To Do
assignee: []
created_date: '2026-10-30 23:20'
updated_date: '2026-10-30 23:27'
labels: []
milestone: m-1
dependencies:
  - TASK-191
  - TASK-192
  - TASK-193
  - TASK-194
  - TASK-196
priority: high
type: task
ordinal: 257000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cut 1.0.0 once every other task in this milestone is done and the user gives the general go-ahead; not before, and not on an agreement given for an earlier step.

semantic-release derives the version from the commits; leaving 0.x needs a commit with a `BREAKING CHANGE:` footer, which `.claude/rules/until-v1.md` forbids until now because leaving 0.x is the user's call. With the go-ahead: one release commit that deletes `.claude/rules/until-v1.md` and carries the `BREAKING CHANGE:` footer (type `feat`, no `!`: the release config does not parse it). The user pushes it; CI then tags v1.0.0, builds the image with `GRIMOIRE_VERSION=1.0.0` and publishes the handbook.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All other tasks of this milestone are done
- [ ] #2 The user has given the general go-ahead for 1.0.0 in so many words
- [ ] #3 One commit deletes `.claude/rules/until-v1.md` and carries a `BREAKING CHANGE:` footer, so semantic-release cuts 1.0.0
- [ ] #4 After the user's push, the release v1.0.0, the image tag 1.0.0 and the handbook exist
<!-- AC:END -->

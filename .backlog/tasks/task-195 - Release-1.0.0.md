---
id: TASK-195
title: Release 1.0.0
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 14:02'
labels: []
milestone: m-1
dependencies:
  - TASK-191
  - TASK-192
  - TASK-193
  - TASK-194
  - TASK-196
  - TASK-209
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
- [x] #1 All other tasks of this milestone are done
- [x] #2 The user has given the general go-ahead for 1.0.0 in so many words
- [x] #3 One commit deletes `.claude/rules/until-v1.md` and carries a `BREAKING CHANGE:` footer, so semantic-release cuts 1.0.0
- [ ] #4 After the user's push, the release v1.0.0, the image tag 1.0.0 and the handbook exist
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Agreed with the user while finishing TASK-194: the release commit, besides deleting .claude/rules/until-v1.md, adds to .claude/rules/memory.md under a new 'Database' heading: 'A released migration is never edited; a schema change is a new numbered file.'

User instruction (2026-10-31): nothing is pushed before this task; the push happens only as part of TASK-195.

Go-ahead given by the user on 2026-10-31 ("Setze nun Task 195 um, am Ende entsteht ... die version 1.0.0"). Release commit deletes .claude/rules/until-v1.md, adds the migration rule to memory.md and carries the BREAKING CHANGE footer.
<!-- SECTION:NOTES:END -->

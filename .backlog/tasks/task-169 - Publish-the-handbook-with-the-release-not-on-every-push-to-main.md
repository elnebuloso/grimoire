---
id: TASK-169
title: 'Publish the handbook with the release, not on every push to main'
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 231000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.github/workflows/handbook.yml` deploys the handbook on every push to `main` that touches `docs/handbook/`, independent of the `check` job in `ci.yml` and of releases, which only happen after the checks pass and with a `feat` or `fix` commit since the last tag. An interface change such as renaming every agent route publishes documentation the moment it reaches `main`, while the released `elnebuloso/grimoire:<version>` image the handbook tells operators to run still serves the old routes; with failing checks that state lasts until they are fixed. Agent developers copy routes that 404.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The handbook is deployed only after a release has been tagged
- [ ] #2 A docs-only change can still be published by a manual `workflow_dispatch`
- [ ] #3 A push to `main` with failing checks does not change the published handbook
<!-- AC:END -->

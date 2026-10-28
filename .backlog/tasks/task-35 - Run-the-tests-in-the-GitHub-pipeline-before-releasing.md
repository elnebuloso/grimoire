---
id: TASK-35
title: Run the tests in the GitHub pipeline before releasing
status: To Do
assignee: []
created_date: '2026-10-28T23:50:00Z'
labels:
  - ops
milestone: m-0
dependencies: []
priority: high
type: chore
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `Release` workflow (`.github/workflows/release.yml`) cuts a release on every push to `main` with `feat` or `fix` commits, but nothing runs the tests first: a broken commit is released as long as its type says so. Tests, lint and type checks so far only run locally (`make test`, `make lint`, `make e2e`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A push to `main` runs the unit tests, lint and type checks, and the browser tests of the admin area, through the `make` targets
- [ ] #2 The release step runs only when all of them passed; a failing check releases nothing
- [ ] #3 Pull requests run the same checks without releasing
- [ ] #4 The checks use the Node version the app requires (`engines` in `app/package.json`)
<!-- AC:END -->

---
id: TASK-30
title: GitHub Actions release with semantic versioning
status: To Do
assignee: []
created_date: '2026-10-28T22:15:00Z'
updated_date: '2026-10-28T22:16:00Z'
labels:
  - ops
milestone: m-0
dependencies: []
priority: high
type: chore
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Releases are cut by hand on GitHub so far, and the version is chosen by eye. The commit rules (`.claude/rules/git.md`, `.claude/rules/until-v1.md`) already assume that CI derives the next version from the Conventional Commits on `main`: `feat` and `fix` release, everything else does not, and only a `BREAKING CHANGE:` footer leaves `0.x`. Decided with the user: semantic-release, started by hand via `workflow_dispatch` so the user chooses when a release goes out; no release branches or release PRs (release-please was rejected for that reason). The user creates the tag `v0.0.0` by hand on GitHub on `Initial commit` (`fb3f953`) as the baseline; the workflow cuts the first real release from it with notes for all commits since. Docker images are not part of this task (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A workflow in `.github/workflows/` runs semantic-release on `main` when started by hand (`workflow_dispatch`)
- [ ] #2 It derives the version from the commits since the last tag: `feat` bumps minor, `fix` bumps patch, other types release nothing
- [ ] #3 It continues from the existing tag `v0.0.0`, so the first run cuts `v0.1.0`, and never cuts `1.0.0` without a `BREAKING CHANGE:` footer
- [ ] #4 Each release creates a `vX.Y.Z` tag and a GitHub release with notes generated from the commits
- [ ] #5 Switching to automatic releases on every push to `main` needs only a `push` trigger added to the workflow
- [ ] #6 Verified by one run on GitHub that releases a real `feat` or `fix` commit
<!-- AC:END -->

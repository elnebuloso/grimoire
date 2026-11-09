---
id: TASK-30
title: GitHub Actions release with semantic versioning
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T22:15:00Z'
updated_date: '2026-10-28T22:25:00Z'
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
- [x] #1 A workflow in `.github/workflows/` runs semantic-release on `main` when started by hand (`workflow_dispatch`)
- [x] #2 It derives the version from the commits since the last tag: `feat` bumps minor, `fix` bumps patch, other types release nothing
- [x] #3 It continues from the existing tag `v0.0.0`, so the first run cuts `v0.1.0`, and never cuts `1.0.0` without a `BREAKING CHANGE:` footer
- [x] #4 Each release creates a `vX.Y.Z` tag and a GitHub release with notes generated from the commits
- [x] #5 Switching to automatic releases on every push to `main` needs only a `push` trigger added to the workflow
- [x] #6 Verified by one run on GitHub that releases a real `feat` or `fix` commit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `.releaserc.json` at the repo root: branches main, tagFormat v${version}, plugins commit-analyzer, release-notes-generator, github (no success/fail comments, no labels); no npm plugin (nothing is published, no root package.json), no git plugin (no bot commit to main); default angular preset.
2. `.github/workflows/release.yml`: workflow_dispatch only, contents: write, checkout with full history, Node 24, `npx semantic-release@25.0.9`.
3. Dry run locally against the remote: last release v0.0.0, next 0.1.0, notes from feat/fix.
4. README.md rewritten (agreed with the user as part of this task): what grimoire is, how it works, status, connecting agents over MCP and HTTP, running, development, releases, license.
5. After the push the user starts the workflow once; check tag v0.1.0 and the GitHub release.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Agreed with the user: a proper README.md is part of this task.

Dry run locally (`npx semantic-release@25.0.9 --dry-run --no-ci` with only commit-analyzer and release-notes-generator, since `gh` is not logged in here): found tag v0.0.0 on main, 47 commits since, next version 0.1.0, notes list all feat and fix commits grouped by type. That `!` without a `BREAKING CHANGE:` footer does not leave 0.x is the documented behaviour of the default angular preset, not tested here. Open: AC #4 and #6 need the real run on GitHub after the push.

First run on GitHub (started by hand) created tag v0.1.0 on 6fdc93f and the GitHub release v0.1.0 by github-actions. The run warned that actions/checkout@v4 and actions/setup-node@v4 target Node 20; moved both to v7, which run on node24. The notice that ubuntu-latest moves to Ubuntu 26 needs no change: the job only needs git and Node.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Releases are cut by semantic-release 25.0.9 from the Conventional Commits on main, started by hand via the Release workflow (.github/workflows/release.yml); adding a push trigger makes it automatic. .releaserc.json keeps only commit-analyzer, release-notes-generator and github (no npm publish, no commit back to main). Baseline tag v0.0.0 on the initial commit, set by the user; the dry run and the first real run cut v0.1.0 with notes for all feat and fix commits. Also rewrote README.md: what grimoire is, how it works, status, connecting agents over MCP and HTTP, running, development and releases. Follow-up: the next workflow run checks the v7 actions.
<!-- SECTION:FINAL_SUMMARY:END -->

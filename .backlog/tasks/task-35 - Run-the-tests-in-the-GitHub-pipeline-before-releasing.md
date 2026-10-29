---
id: TASK-35
title: Run the tests in the GitHub pipeline before releasing
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-29T00:18:00Z'
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
- [x] #1 A push to `main` runs the unit tests, lint and type checks, and the browser tests of the admin area, through the `make` targets
- [ ] #2 The release step runs only when all of them passed; a failing check releases nothing
- [ ] #3 Pull requests run the same checks without releasing
- [x] #4 The checks use the Node version the app requires (`engines` in `app/package.json`)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rename `.github/workflows/release.yml` to `ci.yml` (name `CI`), triggered by push to `main`, `pull_request` and `workflow_dispatch`.
2. Job `check`: setup-node with `node-version-file: app/package.json` (reads `engines.node`), `npm --prefix app ci`, `make lint`, `make test`, `playwright install-deps chromium`, `make e2e`.
3. Job `release`: `needs: check`, skipped on pull requests, keeps the `release` concurrency group and runs semantic-release as before.
4. README: name the workflow and that checks gate the release.
5. Verify locally that lint, unit and browser tests pass without `app/.env`; the first GitHub run verifies the rest.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Workflow renamed to `.github/workflows/ci.yml` (`CI`): job `check` gates job `release`; pull requests run `check` only.
Locally without `app/.env`: `make lint`, `make test`, `make e2e` pass; the e2e config sets its own environment, the build needs none.
The browser tests were flaky (2 of 10 runs): the click on "New source" navigated on the client and `fill('Slug')` hit the Slug field of the project page still on screen. Fixed in the test by waiting for the "New source" heading; 12 of 12 runs passed afterwards.
`setup-node` resolves `>=24.22.1` from `engines.node` to the newest matching release, which may be a newer major than the Docker image's 24.22.1. Not verified on GitHub yet; the first run of the workflow verifies the job setup and `playwright install-deps`.

First GitHub run 40792875159 (push to main): `check` passed with Node 24.22.1 (resolved from `engines.node`, found in the tool cache), lint, 244 unit tests and 6 browser tests incl. `playwright install-deps`; `release` ran after it and released nothing (no `feat`/`fix`). Not yet observed: a failing check blocking the release, and a pull request run.
<!-- SECTION:NOTES:END -->

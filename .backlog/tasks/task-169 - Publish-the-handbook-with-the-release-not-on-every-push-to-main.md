---
id: TASK-169
title: 'Publish the handbook with the release, not on every push to main'
status: Done
assignee: []
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:47'
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
`.github/workflows/handbook.yml` deploys the handbook on every push to `main` that touches `docs/handbook/`, independent of the `check` job in `ci.yml` and of releases, which only happen after the checks pass and with a `feat` or `fix` commit since the last tag. An interface change such as renaming every agent route publishes documentation the moment it reaches `main`, while the released `elnebuloso/grimoire:<version>` image the handbook tells operators to run still serves the old routes; with failing checks that state lasts until they are fixed. Agent developers copy routes that 404. The user decided: the handbook goes live only after a release; docs-only fixes wait for the next release or are deployed by hand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The handbook is deployed only after a release has been tagged
- [x] #2 A docs-only change can still be published by a manual `workflow_dispatch`
- [x] #3 A push to `main` with failing checks does not change the published handbook
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `handbook.yml` runs on `workflow_call` and `workflow_dispatch` only
2. The `release` job in `ci.yml` outputs whether semantic-release tagged HEAD; a new `handbook` job calls `handbook.yml` only then, with `pages: write` and `id-token: write`
3. A tag pushed with `GITHUB_TOKEN` triggers no workflow, so a `release`/tag trigger in `handbook.yml` would never fire; hence the call from CI
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Not run on GitHub yet: the first release after this commit is the real test. Checked locally: both workflows parse as YAML; GitHub docs confirm a called workflow keeps or narrows the caller's `GITHUB_TOKEN` permissions. If the `released` output stays false although a tag was made, check that semantic-release tagged the checked-out HEAD.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook is deployed from CI after a release: the `release` job reports whether semantic-release tagged HEAD, and a `handbook` job then calls `.github/workflows/handbook.yml` (now `workflow_call` plus `workflow_dispatch`). The `release` job needs the `check` job, so a push with failing checks never publishes; a push without `feat`/`fix` publishes nothing; a docs-only fix goes out by hand with `workflow_dispatch`. Verified: YAML parses, permissions per GitHub docs on reusable workflows; not yet exercised on GitHub, the next release run is the real check.
<!-- SECTION:FINAL_SUMMARY:END -->

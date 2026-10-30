---
id: TASK-124
title: Start the built image and sync once before a release pushes it
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:05'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: task
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The indexing worker is loaded with `import.meta.resolve('#lib/server/sync/index-worker.ts')` (`app/src/lib/server/sync/sync.ts` around lines 293-294); the image makes this work by copying `app/src/lib/server` next to the build (`Dockerfile` lines 19-22), and `scripts/reset-admin.ts` relies on the same copy. The contract is only written in comments: everything the worker imports lies under `src/lib/server`, is imported with a `.ts` extension, and uses production dependencies only. CI (`.github/workflows/ci.yml`) runs unit tests and e2e against `node build` in the checkout, where all of `src/` exists; the release (`.releaserc`, `prepareCmd`) builds the image and pushes it without starting it. Changes such as importing `#lib/slug.js` from parsing code, or a dependency that is only in `devDependencies`, would pass every check and break syncing only in the published image ("indexing stopped with exit code 1" on every source). A smoke run turns the comment into a check.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CI builds the image and starts it with throwaway settings before anything is pushed
- [ ] #2 The smoke run makes the image index a local fixture (or load the worker module graph inside the container) and fails the pipeline when that fails
- [ ] #3 The smoke run also checks that `scripts/reset-admin.ts` loads inside the image
- [ ] #4 The check is a `make` target, so it can be run locally the same way
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
scripts/image-smoke.sh behind make image-smoke: in the container, migrate with MIGRATE_ONLY, make a Git fixture with an include, run the real index-worker.ts on it and check the snippet; run scripts/reset-admin.ts without a terminal and expect its prompt refusal (all imports loaded). CI check job runs make image + make image-smoke; the release prepareCmd runs image-smoke before docker push.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified locally: make image && make image-smoke prints 'indexing worker: ok' and 'reset script: ok'. A derived image without app/src/lib/server/sync/url-include.ts fails with ERR_MODULE_NOT_FOUND and exit 1. The CI change itself runs only on the next push.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New make image-smoke (scripts/image-smoke.sh) starts the built image, indexes a small Git fixture with the real indexing worker and loads the reset script, failing on any missing module or dependency. CI's check job builds the image and runs it, and the release runs it between make image and docker push. Passes on the current image; fails with ERR_MODULE_NOT_FOUND on an image missing a worker module. The workflow change itself has not run in GitHub Actions yet.
<!-- SECTION:FINAL_SUMMARY:END -->

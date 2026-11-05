---
id: TASK-250
title: Check the repository path when testing the connection and when saving a source
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 22:19'
labels:
  - admin
  - sync
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: bug
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
"Test connection" only runs `git ls-remote` and reports "Reachable" even when the path in the repository does not exist; the first sync then fails. A wrong path is the most common setup error. The test also refuses to run until a name is entered, and the new-source form pre-fills the path with `docs` although an empty path means the whole repository (findings U2, U3, U24). Owner decision O2: the test checks access, branch and path with the same slim clone the sync uses; saving checks the path too, but only when Git URL, branch or path changed.

Measure M3 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 "Test connection" fails with the same message the sync gives today when the path does not exist in the branch
- [x] #2 Saving a source with a changed Git URL, branch or path checks the path and refuses a missing one with an error at the path field
- [x] #3 Saving without such a change does not contact the Git server
- [x] #4 "Test connection" works without a name
- [x] #5 The new-source form does not pre-fill the path
- [x] #6 Specs cover a missing path for both the test and saving
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The path is looked up by `remotePathExists` in `app/src/lib/server/sync/git.ts`: a shallow, blob-less clone without checkout into a temporary directory, then `git cat-file -t HEAD:<path>` must say `tree`; an empty path is the whole repository and contacts nothing. `checkAccess` runs it after `ls-remote` succeeded (60 s limit, the tree of a large repository) and marks the refusal with `field: path`; saving runs the check when `savingChanges` reports `access` or the new `location` (Git URL, branch or path changed) and returns `pathError`, shown under the path field. The message is a translated sentence, `The path docs does not exist on branch main.`, not the raw English sync error; the meaning is the same.
"Test connection" carries `formnovalidate`, and the new-source form starts with an empty path. Handbook `docs/handbook/admin.md` "Test connection" updated, with the new message in its table.
The e2e story needed a repository that loses `docs/` after saving: `manage.e2e.ts` commits `docs/` before creating the source and removes it before "Sync now", and waits for the sync saving started, since "Sync now" joins a running forced sync. Later connection tests accept the path refusal as proof the token works.
Measured in the agent environment against GitHub: a missing path reported in 1.4–1.9 s, a save without location change 0.2 s.
make lint, make test (1002), make e2e (28), make handbook pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A missing repository path is now caught before a source is saved. "Test connection" checks access, branch and that the path is a directory on the branch, without needing a name; saving checks the path whenever Git URL, branch or path changed and refuses a missing one with the message under the path field; saving without such a change contacts no Git server. The new-source form no longer pre-fills `docs`. Specs cover existing, `./`-written, empty, missing and file paths, and saving with a missing path; the e2e story now commits and removes `docs/` in its test repository. Noticed, not changed: "Sync now" joins a forced sync that is already running, so a commit pushed after that sync checked the branch waits for the next run.
<!-- SECTION:FINAL_SUMMARY:END -->

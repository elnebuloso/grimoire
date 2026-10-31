---
id: TASK-210
title: Decide in one place whether a source save changes access or the index
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
labels:
  - admin
milestone: m-1
dependencies: []
priority: high
type: chore
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Saving a source works out "what changed" in three separate places, each re-reading the stored row with its own normalisation:

- `accessChanged` in `app/src/lib/server/admin/source-access.ts` (~line 17): whether Git URL, branch, username or token changed, which decides if the Git server is asked before saving.
- `savingReindexes` in `app/src/lib/server/admin/sources.ts` (~line 189): whether the save forces a sync.
- the SQL `indexChanged` expression inside `saveSource` in the same file (~line 288): `(git_url IS NOT :git_url OR branch IS NOT :branch OR path IS NOT :path OR exclusions IS NOT :exclusions)`, which clears `last_commit` and `failed_commit`.

The two index decisions already disagree: `savingReindexes` compares `repositoryPath(stored.path)`, the SQL compares the stored `path` as it is. A row whose stored path ends in `/` gets no forced sync but loses its `last_commit`, so it re-indexes on the next scheduled run instead of now.

On top of that, the `save` action in `app/src/routes/manage/sources/[id]/+page.server.ts` calls `sourceProblem`, then possibly `checkSourceAccess` (which calls `remoteProblem`), then `saveSource`, which runs `sourceProblem` and therefore `remoteProblem` once more. One save reads `storedAccess` up to four times.

Cost: the next setting that affects the index (an include list, a second path) has to be added to the TypeScript comparison, the SQL and their doc comments, and to `accessChanged` if it touches access. Missing one gives a stale index or a forced full clone, and no test of the other places notices.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One save action reads the stored source row once and derives from it both whether access changed and whether the index changes
- [ ] #2 The `UPDATE` in `saveSource` takes the "index changed" decision as a parameter instead of recomputing it in SQL
- [ ] #3 A save validates the form (`sourceProblem`, `remoteProblem`) once, not in both the action and `saveSource`
- [ ] #4 A stored path with a trailing slash and the same path without it count as unchanged in every decision; a test covers it
- [ ] #5 Existing tests for saving, forced sync and access checks still pass
<!-- AC:END -->

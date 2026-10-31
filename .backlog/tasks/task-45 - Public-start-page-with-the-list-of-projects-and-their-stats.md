---
id: TASK-45
title: Public start page with the list of projects and their stats
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T01:06:00Z'
updated_date: '2026-10-31 00:17'
labels: []
milestone: m-1
dependencies: []
references:
  - app/src/routes/+page.svelte
  - app/src/lib/server/db/migrations/0001-initial.sql
priority: medium
type: feature
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/` still shows the SvelteKit placeholder ("Welcome to SvelteKit"). Visitors and operators have no overview of what grimoire serves: which projects exist, how much documentation they hold, and whether their sources are in sync.

The page is public by the user's decision, although the agent API lists projects only for an API key scoped to them. That is why it shows only counts and timestamps and no source details: Git URLs, branches, paths and sync error messages can name private repositories or hosts, and the admin area shows them already.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/` lists every project with slug and short description, without login
- [x] #2 Each project shows its size: number of sources, pages and snippets, and the total tokens of its snippets
- [x] #3 Each project shows its sync state: the oldest last sync over its sources (a source never synced counts as not synced) and the number of sources with a sync error
- [x] #4 Each project shows the number of its dead links
- [x] #5 The page shows no Git URLs, branches, paths, usernames, tokens or sync error messages
- [x] #6 With no projects the page says so instead of showing an empty list
- [x] #7 Tests cover the stats for a project with sources, one without sources, and a source that was never synced or failed to sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `src/lib/server/stats.ts`: `projectStats(db)` with one query per project figure, returning counts and times only
2. `/` (`+page.server.ts`, `+page.svelte`): table of projects, structural markup only
3. Unit tests in `stats.spec.ts`; e2e checks for the empty state and for hidden source details
4. Handbook: say in `admin.md` that slugs and descriptions are public
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`last_synced_at` is set by failed syncs too, so "oldest sync" is the oldest attempt; failures are visible in the error count. `oldestSync` is null when any source was never synced or the project has none; the page says "not synced" or "no sources".

The page shows timestamps as stored (ISO, UTC) in a `<time>` element, no formatting, as the source page in the admin area does.

`make lint`, `make test` (285), `make e2e` (8) and `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`/` lists every project with slug, description, sources, pages, snippets, tokens, oldest last sync, sources with a sync error and dead links, without login. The data comes from `projectStats` in `src/lib/server/stats.ts`, which returns only counts and times; a unit test and an e2e test check that no Git URL, branch, path, user, token or error message appears. Empty state: "No projects yet.". Handbook `admin.md` warns that project slugs and descriptions are public. `projectStats` is ready for the admin dashboard (TASK-47).
<!-- SECTION:FINAL_SUMMARY:END -->

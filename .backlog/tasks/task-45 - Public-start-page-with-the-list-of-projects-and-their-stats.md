---
id: TASK-45
title: Public start page with the list of projects and their stats
status: To Do
assignee: []
created_date: '2026-10-29T01:06:00Z'
labels: []
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
- [ ] #1 `/` lists every project with slug and short description, without login
- [ ] #2 Each project shows its size: number of sources, pages and snippets, and the total tokens of its snippets
- [ ] #3 Each project shows its sync state: the oldest last sync over its sources (a source never synced counts as not synced) and the number of sources with a sync error
- [ ] #4 Each project shows the number of its dead links
- [ ] #5 The page shows no Git URLs, branches, paths, usernames, tokens or sync error messages
- [ ] #6 With no projects the page says so instead of showing an empty list
- [ ] #7 Tests cover the stats for a project with sources, one without sources, and a source that was never synced or failed to sync
<!-- AC:END -->

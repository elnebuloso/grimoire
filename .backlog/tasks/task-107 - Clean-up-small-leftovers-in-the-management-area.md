---
id: TASK-107
title: Clean up small leftovers in the management area
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/routes/manage/+page.svelte
  - app/src/routes/manage/query/+page.server.ts
  - app/src/lib/server/agent/http.ts
  - app/src/routes/manage/dead-links/+page.server.ts
priority: low
type: chore
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

- **"New project" link works by accident.** The overview builds it as `resolve('/manage/projects/[id]', { id: 'new' })` (`app/src/routes/manage/+page.svelte`, around line 83). It reaches the wizard only because the static `projects/new` route outranks `[id]`. `resolve('/manage/projects/new')` says what it means. The `'new'` branch of `parseIdParam` (`app/src/lib/server/admin/projects.ts`) is then dead for projects; only the source route still needs it.
- **Third copy of the token-budget check.** `/manage/query` (`app/src/routes/manage/query/+page.server.ts`) validates `tokens` with the same regex as `app/src/lib/server/agent/http.ts` (around line 69). If the agent API gains an upper bound, the admin preview disagrees with it. One shared parser fixes that.
- **Leftover fields in dead-link groups.** `app/src/routes/manage/dead-links/+page.server.ts` (around line 153) spreads the first link into its group, so every group also carries `file`, `anchor` and `target` of that link. Harmless, but misleading to anyone reading the page data.

Not part of this task: `projectFor` (`app/src/routes/manage/projects/[id]/+page.server.ts`) and `pageFor` (`.../sources/[sourceId]/+page.server.ts`) repeat the same parse-find-404 sequence; fine at two copies, worth extracting at a third.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The "New project" link resolves `/manage/projects/new` directly
- [ ] #2 The admin query preview and the agent HTTP API parse the token budget with one shared function
- [ ] #3 Dead-link groups carry only group fields, not those of their first link
- [ ] #4 Existing tests pass
<!-- AC:END -->

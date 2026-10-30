---
id: TASK-107
title: Clean up small leftovers in the management area
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
updated_date: '2026-10-30 03:37'
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
- [x] #1 The "New project" link resolves `/manage/projects/new` directly
- [x] #2 The admin query preview and the agent HTTP API parse the token budget with one shared function
- [x] #3 Dead-link groups carry only group fields, not those of their first link
- [x] #4 Existing tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Overview link: `resolve('/manage/projects/new')`.
2. `parseTokenBudget` next to `DEFAULT_TOKENS` in `search/query.ts`, used by `agent/http.ts` and `/manage/query`.
3. Dead-link groups take only project and source fields from their first link.
4. Tests for the parser and the group fields.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The `'new'` branch of `parseIdParam` stays: the source route still needs it. The MCP tool validates `tokens` with zod (`int().positive()`), which accepts the same numbers; it parses a JSON number, not a string, so it does not go through `parseTokenBudget`. Browser check: 'New project' on `/manage` goes to the wizard, `/manage/query?tokens=0` shows the budget error, the dead links page renders. make lint, make test (559), make e2e (17) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Three small leftovers fixed: the 'New project' link resolves `/manage/projects/new` directly instead of relying on route ranking; the admin query preview and the agent HTTP API parse the token budget with one `parseTokenBudget`; dead-link groups carry only their own fields. Covered by new tests and a browser check.
<!-- SECTION:FINAL_SUMMARY:END -->

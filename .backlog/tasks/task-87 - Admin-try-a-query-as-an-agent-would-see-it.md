---
id: TASK-87
title: 'Admin: try a query as an agent would see it'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:10'
labels:
  - admin
  - search
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/search/query.ts
priority: medium
type: feature
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An admin can see a source's pages and a Markdown preview, but cannot check what an agent actually gets back for a question. Whether a page is found, ranked well or cut off by the token budget is only visible by calling `/query` with an API key by hand. Trying queries in the management area is the shortest loop for improving the docs themselves.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The management area has a form with a question, an optional project and a token budget (default 3,000)
- [x] #2 Submitting it shows the same Markdown answer `query` returns over HTTP and MCP, including the line with the IDs that no longer fit
- [x] #3 Searching without a project searches all projects; no API key is needed, the admin role decides access
- [x] #4 An empty question shows a validation message instead of a result
- [x] #5 Tests cover the action, and a story covers each state of any new component
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New page /manage/query with a GET form (question, project select with 'all projects', token budget defaulting to the search default), so a result has a URL and works without JavaScript.
2. load runs queryProjects with scope 'all' – the same function HTTP and MCP call – and shows its Markdown in a <pre>.
3. Empty question and a token budget that is not a positive whole number return a translated error instead of a result.
4. Link in the management nav.
5. Spec for load: no search before submit, answer equals queryProjects, project restriction, both errors.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GET form at /manage/query; load calls queryProjects with scope 'all', the function behind HTTP and MCP; DEFAULT_TOKENS is now exported from search/query.ts for the form default. No new component (one route, select stays in it), so no story is needed. Verified in the agent environment: answers with Source/Edit lines, 'Did not fit:' line at a 150-token budget, project restriction, tokens=0 error; /manage/query without login redirects to /login. query.spec.ts (5 tests), make lint, make test (507 passed), make handbook.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New page 'Try a query' in the management area (also in the nav): question, project (or all projects) and token budget in a GET form; the answer is the Markdown queryProjects returns to agents, including the 'Did not fit:' line. An empty question or a budget that is not a positive whole number shows a translated error. Handbook admin.md has a section on it. Verified with query.spec.ts, make lint, make test and by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

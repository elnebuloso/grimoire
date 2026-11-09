---
id: TASK-129
title: Rename the agent project lookups that share names with the admin ones
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:14'
labels:
  - agent-api
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 191000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. `listProjects` and `findProject` exist in `app/src/lib/server/agent/operations.ts` (around lines 28 and 222: by slug and API key scope, returning Markdown) and in `app/src/lib/server/admin/projects.ts` (around lines 53 and 59: by ID, returning rows). Both take `db` first, so an editor auto-import picks the wrong one without a type error in every case. Renaming the agent pair (for example `projectsMarkdown` and `visibleProject`) removes the ambiguity.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No two modules under `app/src/lib/server` export a function named `listProjects` or `findProject`
- [ ] #2 Behaviour is unchanged; existing tests pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rename the agent's exported listProjects to listVisibleProjects; the agent's findProject is module-private, so it does not collide on import and stays.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
agent/operations.ts exports listVisibleProjects instead of listProjects; callers (MCP tool, GET /projects, tests) follow. The agent's findProject was never exported, so only admin/projects.ts exports listProjects and findProject now. make lint and the agent, API key and agent-api tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->

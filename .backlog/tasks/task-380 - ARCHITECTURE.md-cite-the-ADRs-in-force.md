---
id: TASK-380
title: Replace docs/ARCHITECTURE.md with a lasting docs/CONCEPT.md
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 14:26'
updated_date: '2026-11-08 15:11'
labels: []
dependencies: []
priority: low
type: docs
ordinal: 442000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
docs/ARCHITECTURE.md mixed the concept of grimoire with implementation details that went stale while building and caused wrong statements: wrong ADR citations, API keys created in the admin area, public off when created, OAuth login later, a data model with columns, and a copy of the agent instructions that had to be synced again and again (TASK-342, TASK-369). The user decided on 2026-11-08 to keep only what holds for grimoire whatever stack, UI and limits it is built with.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/CONCEPT.md holds the idea, the principles and the mechanisms (sources, snippets, IDs and links, output format, search and token budget, sync, agent interface and instructions, secrets), each true independent of stack, UI and tunable limits
- [x] #2 It names no file path, environment variable, endpoint list, default value or plan; decisions are cited by ADR number only
- [x] #3 docs/ARCHITECTURE.md is gone (moved with git mv) and nothing outside the backlog history points to it
- [x] #4 Every statement in docs/CONCEPT.md is checked against the code or the handbook
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git mv docs/ARCHITECTURE.md docs/CONCEPT.md and rewrite it: keep idea, principles, flow, sources, snippets, IDs and links, output format, search, token budget, sync, agent interface, instructions, secrets, writing; drop admin area, encryption details, data model, extension tables, plans, endpoints, authentication, the instructions quote, stack, repository metadata.
2. Check every statement against code and handbook.
3. Fix references outside the backlog history.
4. make format, commit with the backlog update.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked against the code: ranking weights title path 10, text 1, code 0.25 (search/query.ts bm25); packIntoBudget skips what does not fit and ends with 'Did not fit:'; 'Not in any searched source:' names unknown words; the index switches through index_generation (db/sources.ts); sync checks ls-remote first (sync/git.ts); ?section= on /p (routes/p). Greps for paths, environment variables, defaults and plans in CONCEPT.md find only ADR numbers and the example command; nothing outside .backlog names ARCHITECTURE.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
docs/ARCHITECTURE.md (410 lines) is now docs/CONCEPT.md (161 lines), moved with git mv: idea, principles, flow, sources, snippets, IDs and links, output, search, token budget, sync, agent interface, instructions, writing and secrets, each stated so it holds whatever stack, UI and limits grimoire has. Dropped as implementation or plans, all covered elsewhere: admin area, encryption details (ADR 0006), data model, extension and slugify tables (handbook), endpoint list (handbook agents.md), authentication (ADRs 0011, 0013, 0015), the copy of the agent instructions, stack and operations, repository metadata, the version 1/2 plans. The stale statements it held (wrong ADR citations, keys created by admins, public off when created, OAuth later) are gone with it.
<!-- SECTION:FINAL_SUMMARY:END -->

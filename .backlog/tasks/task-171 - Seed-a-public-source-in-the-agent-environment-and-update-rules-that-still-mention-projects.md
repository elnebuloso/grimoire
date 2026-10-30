---
id: TASK-171
title: >-
  Seed a public source in the agent environment and update rules that still
  mention projects
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 16:13'
updated_date: '2026-10-30 16:49'
labels: []
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 233000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/agent-seed.ts` creates all four fixture sources private, so keyless MCP/HTTP access, the visibility column on `/` and **Try a query** do not exist in the state `make agent-reset` produces; checks of public-source changes have had to make a source public by hand first, against the rule to start from the reset state. Two rule files still describe the removed projects model: `.claude/rules/agent-environment.md` labels the key "API key (all projects)", and `.claude/rules/ui-components.md` gives "the source step of the project wizard" as its example of shared fields, a wizard that no longer exists.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After `make agent-reset`, `billing-docs` is public and `platform-docs` stays private
- [x] #2 The fixture table in `.claude/rules/agent-environment.md` shows each source visibility and no longer mentions projects
- [x] #3 `.claude/rules/ui-components.md` uses an example that exists in the code, or none
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `scripts/agent-seed.ts` seeds `billing-docs` public, the other three private
2. Fixture table in `.claude/rules/agent-environment.md`: visibility column, key label "all sources"
3. `.claude/rules/ui-components.md`: setup and login form as the example of shared fields
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
After `make agent-reset`, `billing-docs` is public and `platform-docs`, `billing-archive` and `platform-next` stay private, so keyless MCP/HTTP and **Try a query** can be checked from the reset state. The fixture table in `.claude/rules/agent-environment.md` shows each source's visibility and labels the key "all sources"; `.claude/rules/ui-components.md` uses the setup and login forms (both built from `TextField`) as its example. Verified in the agent environment after a reset: `/sources` without a key lists only `billing-docs`, with the key all four; a keyless `/query?q=invoice` answers from `billing-docs`; also confirmed live there: MCP `query` with `sources: []` returns hits, and a 600-character question on `/` is cut to 500.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-171
title: >-
  Seed a public source in the agent environment and update rules that still
  mention projects
status: To Do
assignee: []
created_date: '2026-10-30 16:13'
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
- [ ] #1 After `make agent-reset`, `billing-docs` is public and `platform-docs` stays private
- [ ] #2 The fixture table in `.claude/rules/agent-environment.md` shows each source visibility and no longer mentions projects
- [ ] #3 `.claude/rules/ui-components.md` uses an example that exists in the code, or none
<!-- AC:END -->

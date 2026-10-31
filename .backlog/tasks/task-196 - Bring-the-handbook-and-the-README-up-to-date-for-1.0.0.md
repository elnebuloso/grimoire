---
id: TASK-196
title: Bring the handbook and the README up to date for 1.0.0
status: To Do
assignee: []
created_date: '2026-10-30 23:27'
updated_date: '2026-10-30 23:40'
labels: []
milestone: m-1
dependencies:
  - TASK-194
documentation:
  - docs/handbook
  - README.md
priority: high
type: docs
ordinal: 258000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 1.0.0 release publishes the handbook and puts the README in front of everyone who finds the project. Both grew task by task through the alpha, so pages may describe behaviour that has since changed, miss features added later, or still carry 0.x wording. They should describe the product as it ships in 1.0.0. The database page is restored separately by TASK-194, so this task builds on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page in `docs/handbook/` matches the behaviour of the current code: no outdated steps, settings, error texts or limits, and no feature that users can reach is left undocumented
- [ ] #2 The handbook follows `.claude/rules/agent-plugin-charter/handbook.md` (one reader per page, nothing the reader can already see, no build internals)
- [ ] #3 `README.md` matches the 1.0.0 state: what grimoire is, how to run it and where the handbook is, with no 0.x-only notes left
- [ ] #4 `make handbook` passes
- [ ] #5 The section "Connecting agents" in `README.md` no longer says "Every request needs an API key": without a key, requests read and search the public sources; a key adds private sources (ADR 0003)
<!-- AC:END -->

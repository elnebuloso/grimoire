---
id: TASK-405
title: >-
  Queries without results: tell a wrong source pick from a gap in the
  documentation
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 19:55'
labels:
  - admin
  - agent-api
dependencies: []
priority: low
type: enhancement
ordinal: 467000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). Since TASK-397 an agent that restricts `query` to sources lacking its words gets "Found in other sources: …", but `agentQuery` in `app/src/lib/server/agent/operations.ts` still records the question under `Management > Quality > Queries without results`, shown as "Nothing found" or with its unknown words. `docs/handbook/admin.md` reads such entries as missing documentation, so an admin looks for a gap that does not exist. `querySources` drops `elsewhere` from `searchHits`, so `agentQuery` cannot tell. Product decision for the owner before building: leave such questions out, or keep them marked with the sources that held the words.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The owner's decision (leave out or mark) is recorded in the task before implementation
- [ ] #2 A question whose missed words another readable source holds is recorded as decided, covered by a spec in `operations.spec.ts`
- [ ] #3 The page and `docs/handbook/admin.md` (Queries without results) describe what such an entry means; new texts exist in every `app/messages/<locale>.json`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner decision (2026-11-08): keep such questions on the list, marked with the other sources that held the words; that also shows which sources agents confuse.
<!-- SECTION:NOTES:END -->

---
id: TASK-405
title: >-
  Queries without results: tell a wrong source pick from a gap in the
  documentation
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:54'
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
- [x] #2 A question whose missed words another readable source holds is recorded as decided, covered by a spec in `operations.spec.ts`
- [x] #3 The page and `docs/handbook/admin.md` (Queries without results) describe what such an entry means; new texts exist in every `app/messages/<locale>.json`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner decision (2026-11-08): keep such questions on the list, marked with the other sources that held the words; that also shows which sources agents confuse.

Migration 0011 adds missed_queries.other_sources (JSON array or NULL; the table is emptied on export, so no export change). querySources now returns elsewhere; agentQuery records it. The page shows "Found in <slugs>" under the words not found; the intro (en, de) says what it means and what to do; admin.md (Queries without results) too. Specs: operations.spec.ts records a wrong-source question with billing-docs and one without other sources with null; missed-queries.spec.ts expects otherSources. Full make test: 1371 passed. Checked by hand in the agent environment (curl queries, page in light and dark).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Queries without results now marks a question whose missing words other sources held with "Found in <sources>": the agent asked the wrong source, which is no gap in the documentation. New column (migration 0011), page intro and handbook explain what to do (sharpen the short descriptions).
<!-- SECTION:FINAL_SUMMARY:END -->

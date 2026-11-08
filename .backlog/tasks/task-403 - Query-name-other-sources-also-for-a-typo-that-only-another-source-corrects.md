---
id: TASK-403
title: 'Query: name other sources also for a typo that only another source corrects'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 19:52'
labels:
  - search
  - agent-api
dependencies:
  - TASK-400
priority: low
type: bug
ordinal: 465000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). In `searchHits` (`app/src/lib/server/search/query.ts`), a typo is corrected only to a word found in the searched sources (`searchInstead` checks each candidate with `occursHere`), and `otherSourcesContaining` (TASK-397) looks only for the word as typed. Case: `query("kubernets", sources: ["platform-docs"])` where only `infra-docs` has "kubernetes": the answer is "No results … Try other terms", while the same question without `sources` corrects the word and finds `infra-docs`. Depends on the per-query work budget of TASK-400, since the extra candidate lookup must stay inside it. TASK-397 (commit 6db0020) was not released when this task was written; if it still is not, this change belongs to that feature and is committed as `feat(query)`, not as `fix` (see `.claude/rules/agent-plugin-charter/releases.md`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A restricted query whose typo is one edit from a word only another readable source contains names that source under "Found in other sources"
- [ ] #2 Sources the reader may not see are never named
- [ ] #3 The extra lookups stay within the per-query budget, covered by a spec
<!-- AC:END -->

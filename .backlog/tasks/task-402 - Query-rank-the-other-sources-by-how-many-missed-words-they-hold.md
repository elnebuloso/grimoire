---
id: TASK-402
title: 'Query: rank the other sources by how many missed words they hold'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:35'
labels:
  - search
  - agent-api
dependencies: []
priority: medium
type: bug
ordinal: 464000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). `otherSourcesContaining` in `app/src/lib/server/search/query.ts` (TASK-397) orders sources by the number of matching snippets over all missed words together and keeps `MAX_OTHER_SOURCES` (5). Case, the handbook's own example "release train": six large sources that mention "release" fill the list, and `ops-handbook`, the only one with "train", is never named, so the hint sends the agent to the wrong source. The spec in `query.spec.ts` ("other sources holding the words a restricted search missed") covers one missed word only. TASK-397 (commit 6db0020) was not released when this task was written; if it still is not, this change belongs to that feature and is committed as `feat(query)`, not as `fix` (see `.claude/rules/agent-plugin-charter/releases.md`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sources are ordered first by how many distinct missed words they contain, then by matching snippets, then by slug
- [x] #2 A spec with two missed words, where many sources hold one and a single source holds both, names that source first
- [x] #3 The answer texts stay as `docs/handbook/search.md` and `docs/handbook/agents.md` describe them
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
otherSourcesContaining tallies per source the distinct missed words and the matches, one rowid pass per word (no join); order: distinct words, matches, slug. Spec "names the source holding most of the missed words first" (release train: ops-handbook before two sources with two "release" snippets each) fails before, passes after. search.md says the new order. Committed as feat(query): TASK-397 is not released yet.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Found in other sources" now names first the sources that hold the most of the missed words, then those with the most matches, so a source covering the whole question is not crowded out by large sources repeating one common word. Spec and handbook updated.
<!-- SECTION:FINAL_SUMMARY:END -->

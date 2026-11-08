---
id: TASK-402
title: 'Query: rank the other sources by how many missed words they hold'
status: To Do
assignee: []
created_date: '2026-11-08 19:51'
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
- [ ] #1 Sources are ordered first by how many distinct missed words they contain, then by matching snippets, then by slug
- [ ] #2 A spec with two missed words, where many sources hold one and a single source holds both, names that source first
- [ ] #3 The answer texts stay as `docs/handbook/search.md` and `docs/handbook/agents.md` describe them
<!-- AC:END -->

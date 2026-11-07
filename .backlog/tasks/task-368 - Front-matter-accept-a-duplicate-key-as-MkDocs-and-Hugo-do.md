---
id: TASK-368
title: 'Front matter: accept a duplicate key as MkDocs and Hugo do'
status: To Do
assignee: []
created_date: '2026-11-07 02:52'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/preprocess.ts
  - app/benchmark/baseline/kubernetes.index.json
priority: medium
type: bug
ordinal: 430000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`preprocessPage` in `app/src/lib/server/parsing/preprocess.ts` parses front matter with the `yaml` package (`parse`), which throws on a duplicate key ("Map keys must be unique"). The page is then skipped with a sync warning. MkDocs reads front matter with PyYAML, which keeps the last value of a duplicate key; Hugo accepts it too.

Case, in the benchmark's Kubernetes copy (`grimoire-fixture-docs/vendor/kubernetes`, see `app/benchmark/baseline/kubernetes.index.json`, "warnings"): `content/en/blog/_posts/2026/ai-conformance-spotlight/index.md` has a duplicate key in its front matter (around line 7) and is the only one of 2,520 pages that is skipped; the published site shows it.

Suggested fix: parse with `uniqueKeys: false` (an option of the `yaml` package; check its exact name and that it keeps the last value, as PyYAML does). After the change the benchmark baseline changes by one page: run `make benchmark-update` and commit the diff with the fix.

Found while building the benchmark (TASK-364/365) on 2026-11-07.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A page whose front matter repeats a key is indexed, with the last value of that key
- [ ] #2 A spec in `preprocess.spec.ts` covers a duplicate key
- [ ] #3 `make benchmark` shows the Kubernetes page indexed; the new baseline is committed with the change
<!-- AC:END -->

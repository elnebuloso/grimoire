---
id: TASK-368
title: 'Front matter: accept a duplicate key as MkDocs and Hugo do'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 02:52'
updated_date: '2026-11-07 09:12'
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
- [x] #1 A page whose front matter repeats a key is indexed, with the last value of that key
- [x] #2 A spec in `preprocess.spec.ts` covers a duplicate key
- [x] #3 `make benchmark` shows the Kubernetes page indexed; the new baseline is committed with the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Parse front matter with yaml's uniqueKeys: false (checked: last value wins, like PyYAML)
2. Spec in preprocess.spec.ts for a repeated key
3. make benchmark-update, commit the baseline with the fix
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
yaml 2.9.1 with uniqueKeys: false keeps the last value (checked: 'a: 1, b: 2, a: 3' -> a: 3), like PyYAML. make benchmark-update: kubernetes 2519 -> 2520 pages, 19343 -> 19350 snippets, the warning is gone, search baseline unchanged. The *.performance.json files moved only by noise (all faster) and were reverted to keep the commit to the index change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Front matter is parsed with uniqueKeys: false, so a repeated key no longer skips the page; the last value wins, as in MkDocs (PyYAML) and Hugo. New spec in preprocess.spec.ts (passes, 25/25). The Kubernetes index baseline now contains blog/_posts/2026/ai-conformance-spotlight/index with 7 snippets and no warnings. Performance baselines were left unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->

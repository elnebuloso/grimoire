---
id: TASK-370
title: 'Search: improve ranking, measured with the benchmark'
status: To Do
assignee: []
created_date: '2026-11-07 02:53'
labels:
  - search
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/benchmark/questions
priority: medium
type: enhancement
ordinal: 432000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The first benchmark (`make benchmark`, questions in `app/benchmark/questions/`, results in `app/benchmark/baseline/*.search.json`) puts the expected section at rank 1 for 8 of 26 answerable questions on Kubernetes and FastAPI, 13 on Zensical and 16 on Material for MkDocs; mean reciprocal rank 0.45 / 0.47 / 0.60 / 0.73. Several are not found within 20 hits, for example the long Kubernetes question about draining nodes and the FastAPI question about splitting a large application.

Known causes to try, one change at a time, each with its effect on all four documentations:
- no word stems: `rollback` does not find `rollbacks` (FTS5's default tokenizer; FTS5 has a `porter` tokenizer for English, which would also need a migration of `snippets_fts`);
- the bm25 weights 10 / 1 / 0.25 for title path / text / code (`searchHits` in `app/src/lib/server/search/query.ts`) were tuned by hand;
- German questions about English documentation match only shared technical words.

Keep a change only when it improves the summary (rank 1, within 3, within 10, MRR) without making any documentation worse beyond one question; record each tried change and its numbers in the task notes, also the rejected ones. Update the baseline with `make benchmark-update` together with a kept change. A tokenizer change is a schema migration (`app/src/lib/server/db/migrations/`, never edit a released one) and re-indexes every source.

Found while building the benchmark (TASK-364/365) on 2026-11-07.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each tried change and its benchmark numbers are recorded in the task notes
- [ ] #2 Kept changes improve the summary of the benchmark without worsening any documentation by more than one question
- [ ] #3 The benchmark baseline is updated with each kept change; `docs/handbook/search.md` matches the new behaviour
<!-- AC:END -->

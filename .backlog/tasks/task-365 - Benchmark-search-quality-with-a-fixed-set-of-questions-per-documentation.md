---
id: TASK-365
title: 'Benchmark: search quality with a fixed set of questions per documentation'
status: To Do
assignee: []
created_date: '2026-11-07 01:44'
labels:
  - search
  - agent-api
dependencies:
  - TASK-364
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/operations.ts
priority: medium
type: feature
ordinal: 427000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Search changes such as the 16-term cap, stopwords and the ranking weights (`toMatchExpression` and `searchHits` in `app/src/lib/server/search/query.ts`) were justified by reasoning and specs only; nothing measured whether agents get better answers. This task adds a fixed set of questions with the snippet ID that should be found, and measures it in `make benchmark` (dependency).

Questions: about 30 per documentation, written by hand, checked into the repository next to the baseline (e.g. `app/benchmark/questions/<name>.json`), each with the expected snippet ID(s) and a short note why. Mix them as agents really ask:
- short and precise ("HPA scale down stabilization window"),
- long and wordy, with filler words,
- in German about English documentation,
- with typos,
- quoting an error message or a command,
- naming a term that appears only in code blocks,
- a few with no answer in the documentation, where "nothing found" is the right result.

The expected ID is taken from the documentation itself, not from what grimoire finds today; otherwise the benchmark only measures today's search. The user reviews the list once before it becomes the baseline.

Measured per question: the rank of the expected ID in the `query` result (the agent operation `querySources` in `app/src/lib/server/agent/operations.ts` with the default token budget, skipped IDs included), or none. Reported per documentation: hits at rank 1, within 3, within 10, the mean reciprocal rank, and for unanswerable questions whether nothing was found. Compared exactly with the baseline, like the index results. Check that equal BM25 scores have a stable order (a secondary order such as the snippet ID in the search query, if it lacks one); without it the ranks are not deterministic.

Agreed with the user on 2026-11-07. A page of benchmark results in the handbook and a version history (e.g. docs/benchmark.md) are explicitly out of scope for now; results live only as the baseline files in the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the four documentations has a question file with about 30 questions of the kinds listed, expected IDs and notes
- [ ] #2 `make benchmark` reports hits at 1, 3 and 10, mean reciprocal rank and the unanswerable questions per documentation, and compares them exactly with the baseline
- [ ] #3 Hits with equal scores come in a stable order; two runs give identical ranks
- [ ] #4 The user has reviewed the questions and expected IDs (noted in this task) before the baseline is written
<!-- AC:END -->

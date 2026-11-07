---
id: TASK-365
title: 'Benchmark: search quality with a fixed set of questions per documentation'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 01:44'
updated_date: '2026-11-07 03:17'
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
- [x] #1 Each of the four documentations has a question file with about 30 questions of the kinds listed, expected IDs and notes
- [x] #2 `make benchmark` reports hits at 1, 3 and 10, mean reciprocal rank and the unanswerable questions per documentation, and compares them exactly with the baseline
- [x] #3 Hits with equal scores come in a stable order; two runs give identical ranks
- [x] #4 The user has reviewed the questions and expected IDs (noted in this task) before the baseline is written
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Four agents write about 30 questions per documentation in the listed kinds, the expected IDs taken from reading the docs and checked against the index baseline
2. benchmark.spec.ts ranks each question with querySources (all hits, no budget cut) and reports rank 1, within 3, within 10, MRR and unanswerable questions with hits, compared exactly with baseline/<name>.search.json
3. Hits with equal scores are ordered by snippet id (refactor(search) 2d1926a)
4. Review of the questions the agents marked as judgement calls, then the baseline
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- 120 questions, per documentation: 8 short, 6 long, 4 German, 3 typo, 3 error/config/command, 2 code-only, 4 without an answer.
- Review: the user asked me to decide the 15 judgement calls. Added expected sections where they answer the question on their own: Kubernetes configure-pdb#protecting-…, quick-reference#updating-resources; Material setting-up-versioning (page intro); FastAPI bigger-applications (intro) and #an-example-file-structure, docker#replication-number-of-processes and #containers-with-multiple-processes-and-special-cases, path-operation-configuration#response-status-code; Zensical colors#accent-color and #custom-colors. The others were kept as proposed; each change is noted in the question's note.
- Baseline (answerable 26 each): Kubernetes rank1 8, within3 13, within10 20, MRR 0.449; Material 16/22/25/0.734; FastAPI 8/16/23/0.479; Zensical 13/18/21/0.602. All 16 unanswerable questions get hits (OR search), now TASK-369.
- Deterministic: identical ranks over the runs with unchanged questions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The benchmark now measures search quality: 120 hand-written questions over the four documentations, each with the section(s) that answer it, ranked by the agent query and compared exactly with a baseline (rank 1, within 3, within 10, mean reciprocal rank, unanswerable questions with hits). Equal scores have a stable order. The first baseline: rank 1 for 8–16 of 26 answerable questions per documentation, MRR 0.45–0.73; every unanswerable question still gets hits. The follow-ups TASK-369 and TASK-370 build on these numbers.
<!-- SECTION:FINAL_SUMMARY:END -->

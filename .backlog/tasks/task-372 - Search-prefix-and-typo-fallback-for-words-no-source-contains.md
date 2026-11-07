---
id: TASK-372
title: 'Search: prefix and typo fallback for words no source contains'
status: To Do
assignee: []
created_date: '2026-11-07 12:33'
labels:
  - search
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/benchmark/README.md
priority: medium
type: enhancement
ordinal: 434000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since 1.11.0 `searchHits` in `app/src/lib/server/search/query.ts` knows the searched words that occur in no searched source (`unknown`). The benchmark shows two causes behind many of them: typos (the weakest question kind, e.g. fastapi-de 0 of 3 typo questions at rank 1; `Hypervisior für minikube instalieren`, `Steuerabschlusbuchung erstelen` not found) and German inflection (`monatlich` while the page says `Monatlicher`).

Try, one at a time and measured with `make benchmark` over all eight documentations:
1. Prefix fallback: an unknown word of at least a few letters is searched as an FTS5 prefix (`"monatlich"*`).
2. Typo fallback: an unknown word is replaced by the closest term of the index vocabulary (FTS5 `fts5vocab`, edit distance computed in JS, candidates limited e.g. by length and first letter), only within the sources the caller may see.

Both stay language-neutral and need no migration. Constraints: the multilingual requirement (no rule that only works for English), the scope rule (a vocabulary term from a hidden source must not leak, neither as a hit nor in the answer), the search time (stay well within the benchmark's 2x tolerance), and the agent-visible answer: decide whether the `Not in any searched source:` line names the corrected word, and keep the agent instructions under 250 tokens.

Keep a change only when it improves the summary without making any documentation worse by more than one question; record every attempt with its numbers in the notes, as TASK-370 did.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prefix and typo fallback are each tried and recorded with their benchmark numbers over all eight documentations
- [ ] #2 A kept fallback improves the summary without worsening any documentation by more than one question, and the search time stays within the benchmark's tolerance
- [ ] #3 A corrected or prefixed word never comes from a source outside the caller's scope; a spec covers it
- [ ] #4 What the agent sees is described in the agent instructions and `docs/handbook/search.md`; the baseline is updated with the change
<!-- AC:END -->

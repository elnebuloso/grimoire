---
id: TASK-372
title: 'Search: prefix and typo fallback for words no source contains'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 12:33'
updated_date: '2026-11-07 13:23'
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
- [x] #1 Prefix and typo fallback are each tried and recorded with their benchmark numbers over all eight documentations
- [x] #2 A kept fallback improves the summary without worsening any documentation by more than one question, and the search time stays within the benchmark's tolerance
- [x] #3 A corrected or prefixed word never comes from a source outside the caller's scope; a spec covers it
- [x] #4 What the agent sees is described in the agent instructions and `docs/handbook/search.md`; the baseline is updated with the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Temporary harness (not committed) running the real querySources against the eight benchmark databases, with deltas against the baseline
2. searchHits checks each searched word first; a word in no searched source gets a fallback
3. Try prefix and typo fallback separately and combined, with length and distance variants
4. Keep the best rule, spec it (scope!), handbook, full benchmark-update
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Attempts (harness, real query code; totals over 8 documentations, 208 answerable questions: rank 1 / within 3 / within 10 / mean MRR). Baseline 105 / 143 / 177 / .617.
- Prefix only, min 4 letters: 105/143/177/.616 (mkdocs +1 r1, fastapi-de -1 r1). Min 5 or 6: 106/143/177/.619. Barely helps: German inflection changes endings rather than only extending a word.
- Typo only (closest fts5vocab term, same first letter, edit distance 1, or 2 from 8 letters): 113/152/183/.653; i-doit-de -1 r1, kubernetes -1 w10.
- Prefix then typo, or typo then prefix: 114/152/183/.655.
- Typo then prefix, 2 edits only from 10 letters: 114/151/183/.655.
- KEPT: typo then prefix, always 1 edit (min 4 letters), prefix min 5: 115/150/182/.656. Every documentation better in rank 1 and MRR; kubernetes loses one within 10 (a German question about English docs: German words corrected into English ones). Two edits gained nothing overall and corrected words of another language into unrelated ones.
Per documentation, kept (r1/w3/w10/MRR, before -> after): kubernetes 9/13/21/.475 -> 10/14/20/.499; mkdocs-material 16/22/25/.740 -> 17/22/25/.759; fastapi 8/15/23/.476 -> 10/16/24/.540; zensical 14/19/21/.642 -> 16/20/22/.700; kubernetes-de 20/22/22/.806 -> 21/23/23/.842; i-doit-de 10/14/18/.495 -> 11/15/19/.530; fastapi-de 7/16/23/.466 -> 8/17/24/.503; odoo-wiki-de 21/22/24/.834 -> 22/23/25/.872.
Typo questions moved most: 'dependancy overides in tests', 'colapsible admonitons', 'Hypervisior für minikube instalieren', 'Steuerabschlusbuchung erstelen', 'Midleware, die jeder Respone …' from not found to rank 1.
Agent-visible: the existing line now says what was searched instead, 'Not in any searched source: instalieren (searched as installieren)'. The vocabulary comes from a per-connection temp fts5vocab table (no migration); every candidate is checked in the caller's scope before it is used. Side effect: an unanswerable question may now get hits through a correction (Kafka question on fastapi-de: 0 -> 20 hits); the line names the correction, so the agent can judge it.

Search time: the first version scanned the vocabulary by the first letter (up to 4 ms per unknown word on Kubernetes' 37,000 terms; small documentations doubled their median). Scanning by the first two letters gives the same ranks on all 208 questions. Clean full run (harness moved out of benchmark/, it had run in parallel and skewed the first measurement), search median before -> after: kubernetes 19.2 -> 23.5 ms (p95 51.6 -> 47.9), mkdocs-material 1.1 -> 2.2, fastapi 1.7 -> 2.7, zensical 1.2 -> 2.0, kubernetes-de 1.6 -> 1.9, i-doit-de 5.7 -> 5.8, fastapi-de 1.9 -> 2.4, odoo-wiki-de 2.3 -> 3.1; all within the 2x tolerance. Performance baselines updated with this change, as the search does more work by design.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A searched word that occurs in no source the caller may read is replaced by the most common index term one edit away (same first two letters, at least 4 letters), else searched by prefix (at least 5 letters); the answer's line names the replacement: 'instalieren (searched as installieren)'. Over the eight benchmark documentations rank 1 rises from 105 to 115 of 208, within 3 from 143 to 150, within 10 from 177 to 182, mean MRR from .617 to .656; every documentation improves at rank 1, Kubernetes loses one question within 10. Search median at most +4 ms. Candidates are checked in the caller's scope (spec). Handbook search.md updated.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-370
title: 'Search: improve ranking, measured with the benchmark'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 02:53'
updated_date: '2026-11-07 10:16'
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
- [x] #1 Each tried change and its benchmark numbers are recorded in the task notes
- [x] #2 Kept changes improve the summary of the benchmark without worsening any documentation by more than one question
- [x] #3 The benchmark baseline is updated with each kept change; `docs/handbook/search.md` matches the new behaviour
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Temporary harness (not committed): index each documentation once into app/.benchmark/dbs, evaluate search variants against the benchmark questions in seconds
2. Try one lever at a time: bm25 weights, porter tokenizer, coordination (more matched words first), per-page cap, stopword lists; record each with numbers
3. Keep only what improves the summary without losing more than one question per documentation; confirm with make benchmark-update; commit code and baseline together
4. A tokenizer change is a migration: numbers to the owner, not built without a decision
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Attempts (harness, same questions; per documentation r1 / w3 / w10 / MRR; order kubernetes, mkdocs-material, fastapi, zensical).
Baseline: 8/13/20/.449, 16/22/25/.734, 8/16/23/.479, 13/18/21/.602.

Weights (title/text/code), rejected: all within about one question of the baseline, none better everywhere.
- 5/1/0.25: 8/12/20/.441, 16/21/25/.731, 7/16/23/.469, 13/18/21/.602
- 20/1/0.25: 7/13/20/.414, 16/22/25/.734, 8/16/23/.474, 13/18/21/.602
- 3/1/0.25: 8/12/20/.438, 15/21/25/.716, 8/16/23/.486, 14/18/21/.624
- 10/1/0.5: 8/12/20/.442, 16/23/25/.746, 8/16/23/.479, 13/18/21/.609
- 10/1/1: 6/12/19/.387, 17/22/25/.749, 8/16/23/.479, 13/18/21/.608
- 10/1/0.1: 7/12/19/.418, 16/21/25/.729, 8/15/22/.460, 12/18/20/.576

Porter tokenizer (porter unicode61), alone, rejected as is: 8/12/20/.437, 15/21/25/.712, 10/16/23/.536, 13/18/20/.599. Helps FastAPI, costs the others a little.

Coordination (number of matched distinct words first, then bm25), rejected: 7/11/19/.389, 17/22/23/.745, 9/15/22/.494, 13/17/22/.602; with porter worse still (Kubernetes .352).

Per-page cap (at most k snippets of a page in front, the rest behind), rejected: k=1 and k=2 lose many questions everywhere (fastapi w10 23 -> 11 / 17), k=3 still loses (zensical w10 21 -> 18). The answer is often a further section of a page that matches several times, so many hits on one page is a good signal, not noise.

Stopwords:
- NLTK English list, all: 9/13/21/.469, 15/21/24/.702, 7/15/23/.457, 14/19/21/.645; mkdocs loses 1 at r1, w3 and w10, fastapi loses 1 at r1 and w3: rejected.
- NLTK without direction words (up down in out on off over under before after above below all more only same): 9/13/21/.475, 16/22/25/.740, 8/15/23/.476, 14/19/21/.642. KEPT: rank 1 45 -> 47, within 10 89 -> 90, within 3 69 -> 69, MRR up in three of four, fastapi loses one question within 3 (allowed). No migration.
- conversational filler (really actually basically just like want ...): 8/12/20/.433, 16/22/25/.740, 8/15/23/.472, 15/19/21/.655: rejected (Kubernetes worse; and a list fitted to the questions would overfit).
- NLTK without direction words + filler: 9/13/20/.459, 16/22/25/.742, 8/15/23/.475, 15/19/21/.662: not better than without filler on Kubernetes; rejected.
- kept list + weights 10/1/0.5: 9/12/21/.468, 16/23/25/.752, 8/15/23/.477, 14/19/21/.649: Kubernetes loses w3; rejected.

Open for the owner: kept list + porter: 8/13/21/.453, 15/22/25/.720, 11/15/24/.550, 13/20/21/.626 - best in total (rank 1 47, within 3 70, within 10 91, mean MRR .587 vs .583 kept and .566 baseline), but mkdocs-material and zensical lose one at rank 1, and it is a schema migration that re-indexes every source and changes German matching. Not built.

Owner requirement (2026-11-07): every decision must keep multilingual documentation and questions working.
- Kept English stopword list checked against it: the added words only leave words out of a question, the index is untouched, so documentation in any language is indexed and matched as before. Of the added words only `her` and `most` are also German words (Most, her = hither), both rare in technical text; no collision with the German list. French/Spanish `me` is a pronoun there too. Acceptable.
- Porter tokenizer: rejected for good, not only open. FTS5's porter stemmer is English-only and runs on every language in the index: it cuts German, French etc. by English suffix rules, conflating unrelated words. A stemming change needs a language-aware solution, out of scope here.
- Gap: the benchmark has German questions but no non-English documentation, so it cannot show a regression on German docs. A German documentation in the fixture would close it (follow-up, ask the owner first).

make benchmark-update confirms the harness numbers exactly: kubernetes 9/13/21/.475, mkdocs-material 16/22/25/.740, fastapi 8/15/23/.476, zensical 14/19/21/.642. Only long questions moved (8 better, 3 worse by 1-3 ranks); German, short, typo and error questions are unchanged, the index too. docs/handbook/search.md already says common English and German words are left out; no change needed. Performance baselines left as they were (noise only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The search leaves out NLTK's English stopwords on top of the existing list, except direction words (down, all, before, ...) that carry meaning in technical questions. Rank 1 rises from 45 to 47 across the four documentations, within 10 from 89 to 90, MRR from .566 to .583 on average; fastapi loses one question within 3, inside the rule. Rejected and recorded with numbers: bm25 weights, porter (English-only, breaks multilingual matching), coordination, per-page cap, conversational filler words. Gap: no non-English documentation in the benchmark yet (TASK-371).
<!-- SECTION:FINAL_SUMMARY:END -->

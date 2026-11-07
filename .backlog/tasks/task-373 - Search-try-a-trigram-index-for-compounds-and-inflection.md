---
id: TASK-373
title: 'Search: try a trigram index for compounds and inflection'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 12:33'
updated_date: '2026-11-07 13:26'
labels:
  - search
dependencies: []
references:
  - app/src/lib/server/db/migrations/0001-initial.sql
  - app/src/lib/server/search/query.ts
priority: low
type: spike
ordinal: 435000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
German compounds and inflection hide words from the word-based FTS5 index: `Pod Lebenszyklus Phasen` is not found in kubernetes-de, where the docs write compounds such as `Pod-Lebenszyklus` (to be checked). FTS5 ships a `trigram` tokenizer that matches substrings in any language.

Measure, before any decision: a second FTS5 table with `tokenize='trigram'` next to `snippets_fts`, used as a fallback for words the main index does not contain, or combined in the ranking. Numbers needed: rank 1 / within 3 / within 10 / MRR for all eight documentations, index size, indexing time, peak memory and search time against the baseline. Try it on a copy of the benchmark databases first (as the harness for TASK-370 did), not as a migration.

A kept version is a schema migration and re-indexes every source on the next sync: the owner decides with the numbers; nothing is built before that. Do it after the prefix and typo fallback, which may already cover part of this.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The trigram variants are measured on all eight documentations, with index size, indexing time, memory and search time, and recorded in the notes
- [x] #2 The numbers are presented to the owner; no migration is built without the decision
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-11-07 on copies of the eight benchmark databases (harness, real query code, after TASK-372). Baseline total rank 1 / within 3 / within 10 / mean MRR: 115 / 150 / 182 / .656.
Size and build: the trigram FTS table is 2.6x the word index (kubernetes 38 -> 98 MB, database file 95 -> 155 MB; i-doit-de 7.5 -> 19.8 MB); building it took 6.3 s for Kubernetes, about 1 s or less for the others.
- V1, trigram instead of the word index: 102 / 139 / 177 / .605; worse on seven documentations (zensical r1 16 -> 11), kubernetes search 23 -> 42 ms per question. Substrings match too much ('port' in 'support').
- V2, reciprocal rank fusion of word and trigram results (k 60 or 10, trigram weight 1, 0.5, 0.25): best 100 / 149 / 183 / .619 (k 10, w 0.5); kubernetes-de loses 9-11 at rank 1 in every weighting; search 3x slower (kubernetes 65 ms per question).
- V3, no trigram index: an unknown word that neither typo nor prefix resolves searches the 5 most common index terms containing it: 115 / 150 / 183 / .656 (kubernetes-de +1 within 10), but kubernetes search 23 -> 53 ms per question. Rejected: one question for twice the time.
The motivating case 'Pod Lebenszyklus Phasen' is not an unknown word: 'phasen' occurs elsewhere, the answering section has 'Pod-Phase' and 'Phasenwerte'. That is inflection of a known word, which only language-aware stemming would solve (porter is English-only, rejected under the multilingual requirement).
Result: nothing kept, no migration proposed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Trigram search measured in three variants on all eight documentations: as the only index, fused with the word index, and as a containment fallback for unknown words. None improves the benchmark: the first two lose 15 and more questions at rank 1 and cost 2.6x index space and 2-3x search time; the third gains one question within 10 for twice the search time. Nothing built, no migration; the remaining German weakness is inflection of known words.
<!-- SECTION:FINAL_SUMMARY:END -->

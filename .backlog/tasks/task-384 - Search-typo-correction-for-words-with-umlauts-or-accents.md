---
id: TASK-384
title: 'Search: typo correction for words with umlauts or accents'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:44'
updated_date: '2026-11-08 18:14'
labels:
  - search
dependencies: []
priority: medium
type: bug
ordinal: 446000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a word of a question occurs in no source, `termsOneEditAway` in `app/src/lib/server/search/query.ts:241-264` looks for an index term one edit away, scanning the FTS5 vocabulary (`fts5vocab`) for terms that start with the same two letters. The search terms come from `searchTerms` (`query.ts:355-357`), which only lowercases them. The FTS5 table uses the default `unicode61` tokenizer, which removes diacritics: the vocabulary holds `anderungen`, `uber`, `konfigurationsanderung`.

Case: German documentation contains "Änderungen"; the question holds the typo `Änderugnen`. The scan runs over `än`..`äo` and finds nothing, the prefix fallback misses too, and the answer reports the word under "Not in any searched source" and searches nothing for it. The same typo typed without the umlaut (`anderugnen`) finds `anderungen`. An umlaut later in a word fails as well: it alone already spends the one allowed edit (`konfigurationsänderugn` is two edits from `konfigurationsanderung`). Four of the eight benchmark documentations (`app/benchmark/documentations.ts`) are German.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A search term is folded the way the unicode61 tokenizer folds it (diacritics removed, e.g. term.normalize('NFD').replace(/\p{Mn}/gu, '')) before the vocabulary is scanned and the edit distance is measured
- [x] #2 A spec in query.spec.ts: a source containing 'Änderungen' is found for the question 'Änderugnen', and the answer names the replacement
- [x] #3 make benchmark runs; an intended change of its results is written with make benchmark-update and committed with the fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. termsOneEditAway folds the typed term as unicode61 does (diacritics of Latin letters removed) before scanning the vocabulary and measuring the edit distance.
2. Spec in query.spec.ts for 'Änderugnen' and 'Konfigurationsänderugn'.
3. make benchmark, then make benchmark-update for the intended change; performance baselines reverted.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Only Latin letters lose their marks (/(\p{Script=Latin})\p{Mn}+/), so a non-Latin script whose vowel signs are combining marks is not changed where the tokenizer keeps them. Benchmark (user accepted after investigation): fastapi-de MRR 0.503 -> 0.539 ('Abhängigkieten' rank 14 -> 1); i-doit-de MRR 0.53 -> 0.485, rank1 11 -> 9; fastapi within10 24 -> 23 ('Länge' now corrected to an English term). Investigated on an i-doit-de index: the two typo questions now rank exactly as the correctly typed questions do (zurücksetzen: rank 3 both; Höheneinheiten: rank 2 both). Their earlier rank 1 came from dropping the unknown word; ranking of the correctly typed questions is a separate matter. New spec fails before, passes after.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Typo correction now works for words with umlauts and accents: the typed word is folded like the unicode61 tokenizer folds the index before the vocabulary scan and the edit distance, so 'Änderugnen' is searched as 'anderungen'. Spec in query.spec.ts; benchmark baselines for fastapi, fastapi-de and i-doit-de updated (mixed: fastapi-de up, i-doit-de down because corrected questions now rank like correctly typed ones).
<!-- SECTION:FINAL_SUMMARY:END -->

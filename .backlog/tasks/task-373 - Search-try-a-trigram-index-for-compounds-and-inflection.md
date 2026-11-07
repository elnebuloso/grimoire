---
id: TASK-373
title: 'Search: try a trigram index for compounds and inflection'
status: To Do
assignee: []
created_date: '2026-11-07 12:33'
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
- [ ] #1 The trigram variants are measured on all eight documentations, with index size, indexing time, memory and search time, and recorded in the notes
- [ ] #2 The numbers are presented to the owner; no migration is built without the decision
<!-- AC:END -->

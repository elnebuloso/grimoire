---
id: TASK-375
title: 'Search: language-aware word stems'
status: To Do
assignee: []
created_date: '2026-11-07 13:30'
labels:
  - search
dependencies: []
priority: low
type: spike
ordinal: 437000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea, not started. The remaining weakness on German documentation is inflection of words that occur in the index in another form: `Pod Lebenszyklus Phasen` misses the section that says `Pod-Phase` (kubernetes-de), because `phasen` occurs elsewhere and no fallback applies. FTS5's `porter` tokenizer is English-only and was rejected under the multilingual requirement (TASK-370); the near-word fallback (TASK-372) only helps words no source contains; trigram search made the ranking worse (TASK-373).

Questions to answer: can stemming follow the language of each page (front matter, site config `language`, or detection), with a stemmer per language (e.g. Snowball) applied to index and question alike; what it costs (schema migration, re-index of every source, index size, search time); what it does to all eight benchmark documentations, English and German. Start only when users miss inflected forms in practice.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An approach and its costs are written down, with benchmark numbers of a prototype on copies of the benchmark databases
- [ ] #2 The owner decides whether to build it
<!-- AC:END -->

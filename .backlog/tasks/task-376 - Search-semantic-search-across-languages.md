---
id: TASK-376
title: 'Search: semantic search across languages'
status: To Do
assignee: []
created_date: '2026-11-07 13:30'
labels:
  - search
dependencies: []
priority: low
type: spike
ordinal: 438000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea, not started. Word search cannot answer an English question from German documentation or the other way round: the benchmark's `english` questions on German docs and `german` questions on English docs are the weakest kinds besides typos. Since TASK-369 the answer tells the agent which words no source contains, so it can ask again in the documentation's language; only meaning-based search would make that unnecessary.

Questions to answer: a multilingual embedding model that runs inside the image without a network service; storing and searching vectors in SQLite; how to combine vector and word ranking (rank fusion of the word index with a trigram index made results worse, TASK-373, so measure carefully); costs in image size, indexing time, memory and search time; the effect on all benchmark documentations. Start only after the cheaper search work is exhausted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Model, storage and ranking approach are written down with their costs, and a prototype measured on copies of the benchmark databases
- [ ] #2 The owner decides whether to build it
<!-- AC:END -->

---
id: TASK-393
title: 'Spike: how much the BM25 length normalisation decides the ranking'
status: To Do
assignee: []
created_date: '2026-11-08 19:12'
labels:
  - search
dependencies: []
priority: low
type: spike
ordinal: 455000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FTS5's `bm25()` scores a matched word lower in a long snippet than in a short one, relative to the average snippet length of the whole index, so across all sources. How a documentation is written (short or long sections) therefore moves its sections up or down, and a source with long sections loses against one with short sections in the same index. grimoire has no say in how documentation is written; agents should still get the right section. Found in TASK-392: both correctly typed `i-doit-de` questions lose rank 1 to short sections that carry the last word in their title, while the expected sections are about 2000 characters long. FTS5 fixes the parameters (k1 = 1.2, b = 0.75, per the SQLite documentation, not measured here); a different normalisation would need a ranking function of our own. Every search decision has to keep multilingual documentation and questions working (see TASK-370).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The notes say how many benchmark questions over all eight documentations change rank when the length normalisation is weakened or removed, measured in a probe and not committed
- [ ] #2 The notes say whether a ranking with its own length normalisation can be built on the FTS5 index under node:sqlite, and what it costs in answer time
- [ ] #3 The notes end with a recommendation for the owner: keep bm25 as it is, or a follow-up task with the measured gain
<!-- AC:END -->

---
id: TASK-408
title: 'Makefile: the benchmark target describes eight documentations, not four'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:51'
updated_date: '2026-11-08 20:58'
labels:
  - ops
dependencies: []
priority: low
type: chore
ordinal: 470000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by the audit of 2026-11-08 (three independent reviewers, the severe findings re-checked by reading). `make help` prints the `## ` description of the `benchmark` target in `Makefile` (around line 34): "Index the four vendored documentations and compare with the baseline in app/benchmark". `app/benchmark/documentations.ts` lists eight (four English, four German).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The description of `benchmark` in `Makefile` names eight documentations or no number
- [x] #2 `make help` shows the new text
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The description of the benchmark target in the Makefile names eight documentations, as app/benchmark/documentations.ts lists; make help shows it.
<!-- SECTION:FINAL_SUMMARY:END -->

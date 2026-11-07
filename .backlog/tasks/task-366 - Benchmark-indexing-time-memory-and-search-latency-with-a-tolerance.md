---
id: TASK-366
title: 'Benchmark: indexing time, memory and search latency with a tolerance'
status: To Do
assignee: []
created_date: '2026-11-07 01:44'
labels:
  - sync
  - search
dependencies:
  - TASK-364
references:
  - Makefile
priority: low
type: feature
ordinal: 428000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Besides the exact comparisons, `make benchmark` (dependency) should show when a change makes indexing or search much slower or hungrier. Time and memory are never exactly the same on a shared machine, so this part is reported and fails only on gross regressions; a tight limit would recreate the flaky tests removed in TASK-355/356/358.

Measured per documentation:
- Indexing: wall time of the sync and the peak resident memory of the indexing child process (`process.resourceUsage().maxRSS` reported by the child, or measured from the parent), the median of several runs (e.g. 3).
- Search: the answer time of the benchmark questions (dependency of the question task is not required: plain timing of a fixed list of the question texts works), after one warm-up run, median and 95th percentile.

Stored in the baseline as numbers with the machine they were taken on noted (cores). `make benchmark` prints them next to the baseline and fails only when a value is more than twice the baseline; `make benchmark-update` writes them anew. Runs under `prlimit --core=1` like `make test` (see `Makefile`), so an out-of-memory child would not dump.

Agreed with the user on 2026-11-07. A page of benchmark results in the handbook and a version history (e.g. docs/benchmark.md) are explicitly out of scope for now; results live only as the baseline files in the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `make benchmark` reports indexing time, peak memory and search latency (median and p95) per documentation next to the baseline
- [ ] #2 It fails only when a value exceeds twice its baseline value; smaller deviations are reported, not failed
- [ ] #3 Three consecutive runs on an idle machine stay within the tolerance
<!-- AC:END -->

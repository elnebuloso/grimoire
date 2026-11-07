---
id: TASK-366
title: 'Benchmark: indexing time, memory and search latency with a tolerance'
status: Done
assignee: []
created_date: '2026-11-07 01:44'
updated_date: '2026-11-07 03:17'
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
- [x] #1 `make benchmark` reports indexing time, peak memory and search latency (median and p95) per documentation next to the baseline
- [x] #2 It fails only when a value exceeds twice its baseline value; smaller deviations are reported, not failed
- [x] #3 Three consecutive runs on an idle machine stay within the tolerance
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The indexing worker reports its peak memory (process.resourceUsage().maxRSS) in its outcome, passed on in the synced result
2. benchmark.spec.ts indexes each documentation three times (BENCHMARK_RUNS) and takes the median of time and memory; search answer time over five passes after a warm-up, median and p95
3. baseline/<name>.performance.json written by make benchmark-update (BENCHMARK_UPDATE=1); make benchmark fails only beyond twice a baseline value
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Baseline on 4 cores: Kubernetes ~143 s, 813 MB, search 22 / 60 ms; Material 23 s, 701 MB, 2.0 / 5.7 ms; FastAPI 13 s, 448 MB, 1.4 / 3.5 ms; Zensical 7 s, 403 MB, 1.2 / 3.2 ms.
- Three make benchmark runs in a row stayed within the tolerance (the one failure in runs 2 and 3 was the search comparison after the questions were reviewed, not time or memory).
- A full make benchmark takes about 9 minutes with three indexing runs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
make benchmark also measures indexing time and peak memory of the indexing process (median of three runs) and the search answer time (median and 95th percentile), stores them with the number of cores and fails only when a value exceeds twice its baseline. Three consecutive runs stayed within the tolerance.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-364
title: >-
  Benchmark: `make benchmark` indexes the four documentations and compares
  against a baseline
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 01:44'
updated_date: '2026-11-07 02:21'
labels:
  - sync
  - parsing
dependencies:
  - TASK-363
references:
  - app/src/lib/server/sync/sync.ts
  - app/src/lib/server/sync/sync.spec.ts
  - .claude/rules/testing-strategy.md
priority: medium
type: feature
ordinal: 426000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Changes to parsing and search shift snippet IDs, dead links and hits without anyone noticing: release 1.10.0 changed anchors of headings with images and the pages listed through symlinks, found only by audits. A benchmark run on fixed inputs makes every such change visible as a diff against a stored baseline. It must be deterministic: the same code gives the same result, bit for bit.

Inputs, all fixed:
- The four documentations under `vendor/` of `elnebuloso/grimoire-fixture-docs` (dependency), pinned by the commit SHA of the fixture repository in the benchmark's config, never by branch. The target clones the fixture repository once into a cache (e.g. under `app/.benchmark/`, ignored by git), checks out the pinned SHA and verifies it; after that no network.
- Each documentation is one source, synced through the real path (`syncSource`, the indexing child process) from a local `file://` clone, as `sync.spec.ts` does, into a fresh database per run.
- URL includes off (no allowed origins); `TZ=UTC`, `LANG=C`; Node and dependencies are already pinned.

Compared exactly against the baseline (a JSON or text file per documentation in the repository, e.g. `app/benchmark/baseline/<name>.json`): the sorted list of all snippet IDs, the number of pages, snippets and tokens, the dead links, and the sync warnings. Nothing time-dependent (sync timestamps) goes in. `make benchmark` fails on any difference and prints a readable diff (e.g. `ci/build-status` → `ci/build`); `make benchmark-update` writes the baseline anew, so an intended change lands with its diff in the commit. Both targets are documented and phony (`.claude/rules/agent-plugin-charter/make.md`); logic beyond a few lines goes into `scripts/` (plain Node rules from `memory.md`: relative `.ts` imports, no parameter properties).

Not part of `make test` or CI on every push: it needs the network once and takes minutes. Describe it in `.claude/rules/testing-strategy.md` (when to run it: before a release and after changes to parsing, sync or search). Check determinism before introducing it: two runs in a row and a run after `rm -rf` of the cache give identical results. Indexing order inside the database (row ids) must not leak into the compared output.

Agreed with the user on 2026-11-07. A page of benchmark results in the handbook and a version history (e.g. docs/benchmark.md) are explicitly out of scope for now; results live only as the baseline files in the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `make benchmark` indexes the four documentations from the pinned fixture commit without network after the first run and compares IDs, counts, dead links and warnings with the baseline
- [x] #2 A difference fails the target and is shown as a readable diff per documentation
- [x] #3 `make benchmark-update` writes the baseline; the baseline files are in the repository
- [x] #4 Two runs in a row, and a run with an emptied cache, give identical results
- [x] #5 `make help` lists both targets; `testing-strategy.md` says when to run the benchmark
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/benchmark/documentations.ts pins the fixture repository by commit (858ac43) and lists the four source paths
2. app/benchmark/fixture.ts clones it once as bare repository into app/.benchmark/ (git-ignored), points a branch `benchmark` at the pinned commit and fetches only if the commit is missing
3. app/benchmark/index.spec.ts syncs each documentation through syncSource from file:// into a fresh database and compares a report (snippet IDs in page order, counts, dead links, sorted warnings) with app/benchmark/baseline/<name>.index.json via toMatchFileSnapshot
4. vite.config.ts adds a project `benchmark` only when BENCHMARK is set, so make test never runs it; Makefile targets benchmark and benchmark-update (TZ=UTC, LANG=C, prlimit)
5. testing-strategy.md: when to run it and its cost; .prettierignore keeps the baseline as written
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Implemented as a vitest project instead of a script under scripts/: the sync code imports without .ts extensions and with #lib, which plain Node cannot load; vitest's file snapshots give the diff and the update for free.
- Baseline: kubernetes 2,519 pages / 19,343 snippets / 53 dead links / 1 warning; mkdocs-material 85 / 1,016 / 66 / 0; fastapi 156 / 1,723 / 0 / 0; zensical 57 / 438 / 7 / 0. Run time 267 s, peak RSS 880 MB.
- Determinism: three runs (update, compare, compare after deleting app/.benchmark) gave identical results. A changed ID in the baseline shows as a one-line diff (checked).
- Found on the way: one Kubernetes page (blog/_posts/2026/ai-conformance-spotlight/index.md) is skipped because its front matter has a duplicate key; Hugo and PyYAML take the last value. Not fixed here; candidate for a follow-up task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`make benchmark` indexes the four vendored documentations from the pinned fixture commit through the real sync and compares every snippet ID, the page, snippet and token counts, the dead links and the warnings with a baseline in app/benchmark/baseline/; any difference fails with a readable diff, and `make benchmark-update` writes the baseline for an intended change. After the first clone it needs no network; three runs, one with an emptied cache, were identical. It runs only when asked (not in make test or CI), takes about 4.5 minutes, and testing-strategy.md says when to run it.
<!-- SECTION:FINAL_SUMMARY:END -->

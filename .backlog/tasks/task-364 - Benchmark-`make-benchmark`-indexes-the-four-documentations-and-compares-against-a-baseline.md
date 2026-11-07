---
id: TASK-364
title: >-
  Benchmark: `make benchmark` indexes the four documentations and compares
  against a baseline
status: To Do
assignee: []
created_date: '2026-11-07 01:44'
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
- [ ] #1 `make benchmark` indexes the four documentations from the pinned fixture commit without network after the first run and compares IDs, counts, dead links and warnings with the baseline
- [ ] #2 A difference fails the target and is shown as a readable diff per documentation
- [ ] #3 `make benchmark-update` writes the baseline; the baseline files are in the repository
- [ ] #4 Two runs in a row, and a run with an emptied cache, give identical results
- [ ] #5 `make help` lists both targets; `testing-strategy.md` says when to run the benchmark
<!-- AC:END -->

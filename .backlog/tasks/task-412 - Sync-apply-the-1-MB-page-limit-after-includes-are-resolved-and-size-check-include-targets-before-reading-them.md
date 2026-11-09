---
id: TASK-412
title: >-
  Sync: apply the 1 MB page limit after includes are resolved, and size-check
  include targets before reading them
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
labels:
  - sync
  - parsing
dependencies: []
priority: medium
type: bug
ordinal: 474000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
A sync skips a page larger than 1 MB (`MAX_PAGE_BYTES` in `app/src/lib/server/sync/index-source.ts`), because parsing table-heavy Markdown costs about 1 GB of memory per MB; the handbook (`docs/handbook/docker.md`, Memory and CPU limits) promises that from 512 MiB on a sync that no longer fits fails cleanly. Includes (`--8<--`, `app/src/lib/server/parsing/include.ts`) are capped separately by `MAX_INCLUDED_CHARACTERS` (1 000 000).

### Problem
The 1 MB check in `prepareCheckout` looks only at the page's own file size (`sizeInside`), before includes are resolved. A 0.9 MB page that includes a 0.95 MB generated table passes both checks and reaches parsing as about 1.85 MB, which can abort indexing on 512 MiB. Also, `readInside` reads an include target completely before the character cap applies: including a 300 MB file loads all 300 MB into memory first.

### Fix
1. After includes are resolved (where the prepared `pages` are built in `prepareCheckout`), skip a page whose resolved Markdown is longer than `MAX_PAGE_BYTES`, with the same warning text as for the file size (`<path>: larger than 1 MB, skipped`).
2. Before reading an include target, check its size with `sizeInside` and refuse it like an over-long include when it exceeds `MAX_INCLUDED_CHARACTERS`.
Specs go next to the existing size cases in `app/src/lib/server/sync/index-source.spec.ts`. Run `make benchmark` afterwards: parsing changed.

### If we skip it
The 512 MiB floor the handbook names does not hold for pages with includes; such a source keeps failing with an out-of-memory abort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A page whose resolved Markdown exceeds MAX_PAGE_BYTES is skipped with the 'larger than 1 MB, skipped' warning
- [ ] #2 An include target larger than MAX_INCLUDED_CHARACTERS is not read into memory
- [ ] #3 Specs cover both cases; make benchmark shows no unintended difference
<!-- AC:END -->

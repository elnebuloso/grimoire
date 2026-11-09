---
id: TASK-409
title: 'Sync: name the page being indexed when the indexing process ends early'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 21:10'
updated_date: '2026-11-09 08:16'
labels:
  - sync
dependencies:
  - TASK-404
priority: low
type: enhancement
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up of TASK-404. Parsing costs about 1 GB of memory and 25 s per MB of table-heavy Markdown (measured on a generated API reference, see the notes of TASK-404). Pages above `MAX_PAGE_BYTES` (1 MB, `app/src/lib/server/sync/index-source.ts`) are skipped, but on a small container a page well below that can still exhaust the memory of the indexing child, or outlast `INDEXING_DEADLINE_MINUTES`. The sync then fails with `indexing ended with SIGABRT before it finished, out of memory for example` or `indexing took longer than 10 minutes` (built in `indexInProcess`, `app/src/lib/server/sync/sync.ts`), which repeats on the same commit and keeps the source on its old index, and the message names no file. The admin cannot tell which page to split.

Decided with the owner (2026-11-09): the child (`app/src/lib/server/sync/index-worker.ts`) appends the repository path of every page to a file before parsing it and empties the file once parsing is over; the server reads the last complete line when the child dies or outlasts the deadline. A file rather than an IPC message: messages still queued in the child are lost when it dies (measured: 843 of 20,000 arrived when the child disconnected right after sending), a written line is with the kernel. Every page, no size threshold: 20,000 appended lines took 73 ms. No page is skipped after a crash (a documentation with skipped pages is half the truth); no own heap limit for the child (Node 24 already sizes it to about half the container limit, measured in `node:24-trixie-slim`). Memory grows over all pages of a source, so the named page is where it ran out, not necessarily the heaviest: the text says "while indexing".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When the indexing process ends early while parsing a page, the sync error names that page (path in the repository), e.g. `indexing ended with SIGABRT before it finished, while indexing docs/api.md, out of memory for example`
- [x] #2 When indexing outlasts the deadline while parsing a page, the error names it too, e.g. `indexing took longer than 10 minutes, while indexing docs/api.md`
- [x] #3 An early end outside page parsing (e.g. while reading the checkout or writing the index) keeps the current text
- [x] #4 `syncErrorKind` still classifies the new texts as `aborted` and `deadline`; `docs/handbook/admin.md` (sync errors) tells the admin to check the named page first and split it, or ask for more memory
- [x] #5 Specs: the out-of-memory spec in `sync.spec.ts` asserts the page; a stand-in that dies before any page keeps the text; the page file is removed with the checkout; `make benchmark` indexing times stay within tolerance
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module `app/src/lib/server/sync/page-log.ts`: append a page path, read the last complete line (a torn last line is ignored), with a spec.
2. `indexPages` takes an `onPage` callback, called with the repository path before each page; the worker opens `job.pageLog` for appending, passes the callback, and empties the file after the loop.
3. `IndexJob` gets `pageLog` (next to the checkout in the work directory, removed with it); `scripts/image-smoke.sh` passes it.
4. `indexInProcess` reads it on `close` and on the deadline and inserts `while indexing <path>`.
5. Specs in `sync.spec.ts` first (fail before), then the code.
6. Handbook `admin.md` (sync errors) and message `admin_fix_aborted` if it needs the page; `make benchmark`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as planned: `page-log.ts` (append, empty after parsing, read last complete line), `onPage` in `indexPages`, `pageLog` on `IndexJob` as `<checkout>.pages`, removed with the checkout. Fix hints `admin_fix_aborted` and `admin_fix_deadline` (en, de) now tell to have the named page split. Verified: `sync.spec.ts` (out-of-memory spec names `docs/huge.md`, stand-in killed before any page keeps the text, stuck stand-in past the deadline names its page, work directory empty afterwards), `page-log.spec.ts` (torn line ignored, cleared log names nothing), `error-kind.spec.ts` (new texts → `deadline`/`aborted`), `index-worker.spec.ts`; `make test TEST=--changed` 190 passed; `make benchmark` 24 passed, indexing times within tolerance. `scripts/image-smoke.sh` passes `pageLog`; `make image && make image-smoke` still to run before the push.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
When the indexing process dies or outlasts the deadline while parsing a page, the sync error now names that page (`…, while indexing docs/api.md, …`), so an admin knows which file to split. The child appends each page path to a file before parsing it (a file, because IPC messages queued in a dying process are lost) and empties it after the loop, so an end outside parsing keeps the old text. Handbook (`admin.md` sync errors) and the fix hints say to split the named page first; it is where memory or time ran out, usually but not always the culprit. Tests and benchmark green; image smoke test pending before the push.
<!-- SECTION:FINAL_SUMMARY:END -->

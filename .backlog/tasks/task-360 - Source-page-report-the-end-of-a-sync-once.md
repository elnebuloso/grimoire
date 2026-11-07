---
id: TASK-360
title: 'Source page: report the end of a sync once'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 01:04'
labels:
  - admin
dependencies: []
references:
  - 'app/src/routes/manage/sources/[id]/[[tab=tab]]/sync-poll.ts'
priority: low
type: bug
ordinal: 422000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`pollSyncEnd` in `app/src/routes/manage/sources/[id]/[[tab=tab]]/sync-poll.ts` asks every 2 s (`POLL_MS`) with `setInterval` and an async callback whether a sync is still pending, and calls `ended()` once it is not; `+page.svelte` (around lines 26-36) then refreshes and shows a toast. There is no in-flight guard, and `clearInterval` does not stop a request already sent.

Cases (from reading, not reproduced): an answer slower than 2 s (VPN, busy server) lets two requests overlap, and both can see `pending: false`; switching tab or saving settings during a sync restarts the effect while an old request is still out. Either way `ended()` runs twice: two refreshes and two "sync … done" toasts.

Suggested fix: chain `setTimeout` after each answer instead of `setInterval`, and check a `stopped` flag set by the returned stop function after each `await`.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `ended` is called at most once per poll, also with answers slower than the interval
- [x] #2 Stopping the poll while a request is out prevents `ended`
- [x] #3 A browser spec (`*.svelte.spec.ts`) with a slow mocked fetch covers it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec with fake timers and a fetch answering after 5 s and 3 s: ended once, and not after stop
2. pollSyncEnd chains setTimeout after each answer instead of setInterval, and checks a stopped flag after the await
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Before: ended 3 times with slow answers, and once after stop; after: once, and never after stop. Sources route specs pass (36 tests with the new one).
- The spec is a server spec (sync-poll.spec.ts), not a browser spec as AC #3 named: the poll needs no DOM, and fake timers with a stubbed fetch run reliably there. The e2e step "syncs a source now" walks the poll in the browser.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page now asks whether a sync ended only after the previous answer came, and ignores an answer that arrives after it stopped asking, so a slow server or a tab switch during a sync no longer reports the end twice with two refreshes and two toasts. Covered by a spec with fake timers and a slow fetch.
<!-- SECTION:FINAL_SUMMARY:END -->

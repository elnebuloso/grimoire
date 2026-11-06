---
id: TASK-360
title: 'Source page: report the end of a sync once'
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
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
- [ ] #1 `ended` is called at most once per poll, also with answers slower than the interval
- [ ] #2 Stopping the poll while a request is out prevents `ended`
- [ ] #3 A browser spec (`*.svelte.spec.ts`) with a slow mocked fetch covers it
<!-- AC:END -->

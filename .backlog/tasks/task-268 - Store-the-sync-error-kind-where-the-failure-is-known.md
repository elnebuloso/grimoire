---
id: TASK-268
title: Store the sync error kind where the failure is known
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:55'
updated_date: '2026-11-06 16:24'
labels:
  - sync
dependencies: []
priority: high
type: bug
ordinal: 330000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`syncErrorKind` in `app/src/lib/server/sync/error-kind.ts` works out the kind of a stored sync error by matching regexes against the English message. The messages are written elsewhere (`sync/git.ts`, `sync/index-source.ts`, `sync/sync.ts`, `sync/connection-policy.ts`). The structured answer exists before the text: `checkRemote` in `sync/git.ts` returns `ok | no-branch | refused | unreachable | redirected | forbidden`, and `remoteCommit` then throws it away with `throw new Error(check.detail)`.

What goes wrong today (reasoned from the code, not reproduced):
- A redirect ("the Git server redirects this URL elsewhere (HTTP 301)") falls through to `^git \S+ failed:` and is shown as "The Git server could not be reached" (`sync_error_unreachable`).
- A host outside `GIT_ALLOWED_HOSTS` (`ConnectionRefused`) and a host without an address (`getaddrinfo ENOTFOUND`) carry no `git … failed:` prefix and end as `unknown`: no summary and the generic fix, while "Test connection" on the same page names the refused host.
- Any rewording at a throw site silently turns the error into `unknown`. Because the kind is recomputed on every page view (`admin/status.ts`), a rewording relabels the whole sync history.

`docs/handbook/admin.md` ("Sync errors" table) quotes eleven of these English messages verbatim, so a rewording also breaks the handbook. `error-kind.spec.ts` tests string literals only; `git.spec.ts` already produces the real redirect text and `connection-policy.spec.ts` the refused-host text, but neither passes it to `syncErrorKind`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The kind is decided where the failure is known (e.g. `remoteCommit` maps `check.status`) and stored with the sync error and the sync run, in a new numbered migration
- [x] #2 The new column is listed in `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS` so `instance-export.spec.ts` passes
- [x] #3 A redirect is shown as a redirect, a refused host and an unresolvable host get their own kind and fix
- [x] #4 Rows written before the migration still get a kind (the regex may remain as fallback for them)
- [x] #5 Specs feed the messages the code actually throws (redirect, refused host, no address) into the classification and fail on a mislabel
- [x] #6 The handbook sync error table stays correct, ideally keyed by kind instead of verbatim English text
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SyncFailure (kind + message) in sync/failure.ts, importable by the indexing child
2. git.ts, index-source/index-pages, sync.ts throw it where the kind is known; the child passes the kind over IPC
3. Migration 0008: error_kind on sources and sync_runs; written with every error, cleared with it
4. Admin status reads the stored kind; syncErrorKind stays as fallback for older rows
5. New kinds redirect, forbidden, noAddress with summaries and fixes in en/de
6. Specs on real messages; handbook table keyed by the shown summary
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- New kinds: redirect, forbidden (host outside GIT_ALLOWED_HOSTS or internal), noAddress (DNS ENOTFOUND, 'has no address', git 'Could not resolve host').
- Errors thrown outside grimoire's code (e.g. Node lookup during clone) still fall back to the message classification at write time.
- An undecryptable stored token is recorded as access.
- The scheduler's invalid-cron error is stored as unknown; it has no summary, as before.
- error_kind is a runtime column of sources; sync_runs is emptied by the export anyway.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The kind of a sync error is now decided where the failure is known and stored with the error (sources.error_kind, sync_runs.error_kind, migration 0008). Redirects, refused hosts and unresolvable hosts have their own kind, summary and fix; older rows fall back to the message patterns. Verified: git.spec, connection-policy.spec, sync.spec (real child: path kind stored on source and run), sync-logic.spec, instance-export.spec; full make test green, svelte-check clean. Handbook sync error table now keyed by the summary the UI shows.
<!-- SECTION:FINAL_SUMMARY:END -->

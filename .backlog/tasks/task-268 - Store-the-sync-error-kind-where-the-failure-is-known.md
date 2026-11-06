---
id: TASK-268
title: Store the sync error kind where the failure is known
status: To Do
assignee: []
created_date: '2026-11-06 15:55'
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
- [ ] #1 The kind is decided where the failure is known (e.g. `remoteCommit` maps `check.status`) and stored with the sync error and the sync run, in a new numbered migration
- [ ] #2 The new column is listed in `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS` so `instance-export.spec.ts` passes
- [ ] #3 A redirect is shown as a redirect, a refused host and an unresolvable host get their own kind and fix
- [ ] #4 Rows written before the migration still get a kind (the regex may remain as fallback for them)
- [ ] #5 Specs feed the messages the code actually throws (redirect, refused host, no address) into the classification and fail on a mislabel
- [ ] #6 The handbook sync error table stays correct, ideally keyed by kind instead of verbatim English text
<!-- AC:END -->

---
id: TASK-236
title: >-
  Explain a redirect from the Git server and suggest the URL it points to on the
  same host
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 13:56'
updated_date: '2026-11-05 14:06'
labels:
  - sync
  - admin
dependencies: []
priority: high
type: feature
ordinal: 298000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitLab answers a Git URL without `.git`, and the old path of a moved project, with a redirect. grimoire refuses redirects for every outgoing Git call (TASK-233), so such sources fail with "The Git server cannot be reached: … returned error: 301", which reads like a network problem. The owner decided on 2026-11-05 not to follow redirects (Git cannot limit them to the same host, and a moved project path can later point to another project), but to say what happened (A) and, where the target lies on the same host, to suggest it (B). Git itself does not name the target of a refused redirect (checked with git 2.43).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A redirect answer (301, 302, 307, 308) is reported as its own message on Test connection, on save and as sync error: the Git server redirects this URL elsewhere; use the clone URL, usually ending in `.git`; a moved project has a new path
- [x] #2 On Test connection and on save, grimoire sends one request to the checked address (pinned as Git is, with the same credentials, without following) and reads only the Location header; the target is never requested
- [x] #3 When the target has the same scheme, host and port, the message names it as the URL to enter, without credentials or query; otherwise it names no target
- [x] #4 The request trusts the CA file in `GIT_SSL_CAINFO` when it is set; if the request fails, the message without target stays
- [x] #5 The stored Git URL never changes by itself
- [x] #6 The Git URL field says to use the clone URL, usually ending in `.git`; the handbook lists the new messages
- [x] #7 Specs cover the classification, the same-host suggestion, another host, credentials and query stripped, and a failing request; `make test`, `make e2e`, `make lint` and `make image-smoke` pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A: git.ts maps Gits "returned error: 301/302/307/308" to its own reason, and checkRemote reports status redirected with the HTTP status. B: redirectTarget sends one GET to <checked URL>/info/refs?service=git-upload-pack at the pinned address, with the credentials Git would send and the CA file of GIT_SSL_CAINFO, reads only Location, and names the target only on the same origin, without credentials, query, fragment or /info/refs. checkAccess (test connection and save) uses it and falls back to the message without target when it fails. The Git URL field has a hint; admin.md lists the messages. Verified: make test 930/930, make e2e 25/25, make lint, make image-smoke, make handbook; the hint looked at in light and dark. Not verified against a real GitLab: the redirect behaviour is taken from the owners report and tested with a local server.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A redirect from the Git server is now reported as such, on Test connection, on save and as sync error, with what to do: use the clone URL, usually ending in .git. Where the target lies on the same host, Test connection and save name it as the URL to enter, found by one request to the checked address that reads only the Location header; grimoire still follows no redirect and never changes a stored URL. The Git URL field says to use the clone URL. Verified with make test, make e2e, make lint, make image-smoke and make handbook.
<!-- SECTION:FINAL_SUMMARY:END -->

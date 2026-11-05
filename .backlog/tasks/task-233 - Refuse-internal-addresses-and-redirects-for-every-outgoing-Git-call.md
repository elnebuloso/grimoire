---
id: TASK-233
title: Refuse internal addresses and redirects for every outgoing Git call
status: To Do
assignee: []
created_date: '2026-11-05 12:47'
labels:
  - sync
  - admin
dependencies: []
priority: high
type: bug
ordinal: 295000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In 1.1.1 "Test connection" on the source form, and every sync, let grimoire connect to any address the Git URL names, internal ones such as `10.0.0.5` or `127.0.0.1` included. Whoever may add a source can use it to look into the network the server stands in. The owner confirmed the rules below on 2026-11-05. A former implementation exists outside the repository, in `/workspace/github.com/elnebuloso/grimoire-before-reset`, commit `deb95b2` (`connection-policy.ts`, `scripts/git-https-server.ts` for e2e and the image smoke); it is a reference to read, not to copy wholesale. Operators with an internal Git server see their syncs fail after the update until they list the host; that is accepted without a major version.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every Git call that reaches a remote (connection test, sync, polling) is checked first: `https` only, on port 443, a host name rather than an IP address, and every address the name resolves to is a public internet address
- [ ] #2 A host the operator lists in `GIT_ALLOWED_HOSTS` is allowed on any address and port, `https` still required
- [ ] #3 Redirects are refused, and Git connects to exactly the address that was checked, not to one it looks up again
- [ ] #4 Behind a proxy only hosts listed in `GIT_ALLOWED_HOSTS` are allowed
- [ ] #5 No setting switches the check off
- [ ] #6 A refused host gets one message that names it and tells the reader to ask the person running grimoire to add it to `GIT_ALLOWED_HOSTS`
- [ ] #7 At start the server logs the sources whose host is refused
- [ ] #8 Unit specs cover each rule; e2e and the image smoke test still reach their repositories; `make test`, `make e2e`, `make lint` and `make image-smoke` pass
- [ ] #9 The operator page of the handbook documents `GIT_ALLOWED_HOSTS` and the refused-host message
<!-- AC:END -->

---
id: TASK-233
title: Refuse internal addresses and redirects for every outgoing Git call
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 12:47'
updated_date: '2026-11-05 13:03'
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
In 1.1.1 "Test connection" on the source form, and every sync, let grimoire connect to any address the Git URL names, internal ones such as `10.0.0.5` or `127.0.0.1` included. Whoever may add a source can use it to look into the network the server stands in. The owner confirmed the rules below on 2026-11-05. Operators with an internal Git server see their syncs fail after the update until they list the host; that is accepted without a major version.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every Git call that reaches a remote (connection test, sync, polling) is checked first: `https` only, on port 443, a host name rather than an IP address, and every address the name resolves to is a public internet address
- [x] #2 A host the operator lists in `GIT_ALLOWED_HOSTS` is allowed on any address and port, `https` still required
- [x] #3 Redirects are refused, and Git connects to exactly the address that was checked, not to one it looks up again
- [x] #4 Behind a proxy only hosts listed in `GIT_ALLOWED_HOSTS` are allowed
- [x] #5 No setting switches the check off
- [x] #6 A refused host gets one message that names it and tells the reader to ask the person running grimoire to add it to `GIT_ALLOWED_HOSTS`
- [x] #7 At start the server logs the sources whose host is refused
- [x] #8 Unit specs cover each rule; e2e and the image smoke test still reach their repositories; `make test`, `make e2e`, `make lint` and `make image-smoke` pass
- [x] #9 The operator page of the handbook documents `GIT_ALLOWED_HOSTS` and the refused-host message
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module app/src/lib/server/sync/connection-policy.ts, loadable by plain node (relative .ts imports): the policy (allowed hosts, proxy present), parsing of GIT_ALLOWED_HOSTS (exact host names only, invalid entry fails the start), isPublicAddress (node:net BlockList: private, loopback, link-local, CGNAT, documentation, multicast ranges; IPv6 only global unicast), checkConnection (parse, https only, port 443 unless listed, no IP literal unless listed, proxy => listed only, resolve once, every address public unless listed) returning the URL to use and the address to pin, ConnectionRefused carrying the host as a code (no text: plain node has no messages).
2. GIT_ALLOWED_HOSTS declared in app/src/env.ts, optional; the policy also notes HTTPS_PROXY/ALL_PROXY.
3. app/src/lib/server/sync/git.ts: GitRemote carries the policy; every call that reaches the remote (ls-remote, clone, sparse-checkout set/add with their lazy fetches) checks first and runs Git with http.curloptResolve pinned to the checked address, http.followRedirects=false, protocol.allow=never plus protocol.https.allow=always, GIT_CONFIG_NOSYSTEM and GIT_CONFIG_GLOBAL=/dev/null, all entries in one GIT_CONFIG_COUNT list with the credentials header. The policy travels with the job to the indexing child process.
4. Connection test (admin/source-access.ts): a refused host returns the new message naming it and GIT_ALLOWED_HOSTS (en and de); a sync on a refused host fails with the same reason. At start the server logs every source whose host is refused.
5. Tests: unit specs for every rule with a stubbed DNS lookup; local test repositories (file://, http://127.0.0.1) pass only through a policy flag tests set, never the environment. e2e and the image smoke test reach their repository through a local https Git server with a self-signed certificate made by openssl at run time (replaces the file:// insteadOf), GIT_ALLOWED_HOSTS=localhost.
6. Handbook, operator page: GIT_ALLOWED_HOSTS, the proxy rule, the refused-host message as a troubleshooting heading.
7. make test, make e2e, make lint, make image-smoke in full (the change reaches every sync).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ported from the archived commit deb95b2 (git apply with rejects, six hunks redone by hand): connection-policy.ts and scripts/git-https-server.ts as they were, git.ts pins every remote call and runs Git without system or user configuration, the policy travels with the job to the index worker, hooks.server.ts logs refused sources at start. The source page spec mocks GIT_ALLOWED_HOSTS and expects the policy without pinning `proxy`, which follows the machine. Handbook: docker.md gets the variable, the Git servers section and the update warning; admin.md the message under Test connection and Sync errors. Verified: make test 858/858 (82 files), make e2e 23/23, make lint clean, make image and make image-smoke pass ("git over https and indexing process: ok"), make handbook --strict passes. Not verified: behaviour behind a real proxy and with a real internal CA (only unit specs and the self-signed test server).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every outgoing Git call (connection test, sync, polling) is checked before it runs: https only, port 443, a host name whose addresses are all public, no redirects, Git pinned to the checked address and blind to system and user Git configuration. GIT_ALLOWED_HOSTS lets the operator allow internal Git servers; behind a proxy only listed hosts are reached; nothing switches the check off. A refused host gets one message naming it and GIT_ALLOWED_HOSTS; the server logs such sources at start. e2e and the image smoke reach their repositories through a local https Git server. Released as feat (1.2.0) because instances with an internal Git server must set GIT_ALLOWED_HOSTS. Verified with make test, make e2e, make lint, make image-smoke and make handbook. Risk: behaviour behind a real proxy and with a real internal CA is covered by unit specs only.
<!-- SECTION:FINAL_SUMMARY:END -->

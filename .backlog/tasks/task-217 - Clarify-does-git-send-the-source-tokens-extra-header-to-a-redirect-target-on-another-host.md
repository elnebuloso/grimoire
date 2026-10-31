---
id: TASK-217
title: >-
  Clarify: does git send the source token's extra header to a redirect target on
  another host
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:24'
labels:
  - admin
  - sync
milestone: m-1
dependencies: []
priority: medium
type: spike
ordinal: 279000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`credentialEnvironment` in `app/src/lib/server/sync/git.ts` (~lines 136-145) passes a source's credentials to git as `GIT_CONFIG_KEY_0=http.<remote url>.extraHeader` with `Authorization: Basic ...`. Whether git keeps sending that URL-scoped header after the Git server redirects to another host is not verified. If it does, a Git server (or anyone who controls a redirect from it) can obtain the stored token. `remoteProblem` stops the admin from moving a stored token to another origin by editing the URL, but it does not cover redirects.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The behaviour of the git version in the Docker image is established by a reproducible test (e.g. a local HTTP server that redirects to a second host and logs the headers it receives)
- [x] #2 If the header is sent along, a follow-up bug task exists to keep the token from following redirects to another host; if not, the test or a comment at `credentialEnvironment` records the reason
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Probe script (scratchpad): server A on 127.0.0.1 redirects to server B on localhost (other host and port), B logs the Authorization header; control: a redirect on the same server. git ls-remote with the environment credentialEnvironment builds.
2. Run it with the local git and in node:24.22.1-trixie-slim with Debian's git, the image's base.
3. Turn the result into a spec next to credentialEnvironment (git.spec.ts or sync.spec.ts) so it stays checked; follow-up bug task only if the header leaks (with the user's approval).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Probe: server A (127.0.0.1) redirects /same/ on itself and /other/ to server B (localhost, other port); git ls-remote with the credentialEnvironment headers. Local git 2.43.0 / libcurl 8.5.0 and node:24.22.1-trixie-slim with Debian git 2.47.3 / libcurl 8.14.1 (the image's base and package) behave alike: the Authorization header goes along the same-host redirect and is dropped on the redirect to the other host.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Answer: no. git does not send the URL-scoped extraHeader with the token to a redirect target on another host; it does send it along a redirect on the same server. Measured with git 2.43.0/libcurl 8.5.0 locally and git 2.47.3/libcurl 8.14.1 in node:24.22.1-trixie-slim, the base of the Docker image. Recorded as the spec 'a Git server that redirects' in app/src/lib/server/sync/git.spec.ts: two local HTTP servers, checkRemote with a token, asserting the headers each server receives; it fails if a future git or curl starts forwarding the token. No follow-up bug task needed.
<!-- SECTION:FINAL_SUMMARY:END -->

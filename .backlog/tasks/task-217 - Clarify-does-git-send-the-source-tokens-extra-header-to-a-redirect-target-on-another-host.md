---
id: TASK-217
title: >-
  Clarify: does git send the source token's extra header to a redirect target on
  another host
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
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
- [ ] #1 The behaviour of the git version in the Docker image is established by a reproducible test (e.g. a local HTTP server that redirects to a second host and logs the headers it receives)
- [ ] #2 If the header is sent along, a follow-up bug task exists to keep the token from following redirects to another host; if not, the test or a comment at `credentialEnvironment` records the reason
<!-- AC:END -->

---
id: TASK-38
title: Verify syncing private repositories on GitLab, GitHub, Forgejo and Gitea
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: task
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sources authenticate with a username and access token sent as HTTP Basic auth via `http.<url>.extraHeader` (`app/src/lib/server/sync/git.ts`). This was only tested against a local bare repository over `file://` and a public GitHub repository without a token. Before `1.0.0`, sync a private repository on each provider with the token type the admin area names for it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A private repository syncs on GitLab with a deploy token, on GitHub with a fine-grained token, and on Forgejo or Gitea with an access token
- [ ] #2 A wrong or revoked token shows a sync error at the source that contains no token
- [ ] #3 Findings that differ per provider are documented in `docs/handbook/admin.md`
<!-- AC:END -->

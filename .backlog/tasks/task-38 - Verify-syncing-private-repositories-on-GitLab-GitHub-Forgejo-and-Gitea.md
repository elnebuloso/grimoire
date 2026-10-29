---
id: TASK-38
title: 'Verify syncing private repositories on GitLab, GitHub, Forgejo and Gitea'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29 22:42'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GitLab verified 2026-10-29 against a private repository on a self-hosted GitLab with a deploy token (username and token given by the user for the check only; not recorded anywhere, the test source was removed with make agent-reset and the check scripts deleted):
- Test connection with the deploy token: reachable, branch main at its commit. Creating the source synced it: 9 pages, 105 snippets, no warnings.
- Wrong token at Test connection, and a revoked token simulated by storing a rejected token encrypted and running Sync now: both answer 'git ls-remote failed: fatal: could not read Username for https://<host>: terminal prompts disabled'. Shown at the source and on the dashboard; neither token nor username appears on the page or in the server log.
- Documented in docs/handbook/admin.md under 'Tokens per Git host'.
Open: GitHub (fine-grained token) and Forgejo or Gitea (access token) need a private repository and a token each; AC 1 stays unchecked until they are verified. AC 2 holds for GitLab and is to be repeated per provider.
<!-- SECTION:NOTES:END -->

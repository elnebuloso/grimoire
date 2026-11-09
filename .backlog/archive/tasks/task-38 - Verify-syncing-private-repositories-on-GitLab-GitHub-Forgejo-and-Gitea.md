---
id: TASK-38
title: 'Verify syncing private repositories on GitLab, GitHub, Forgejo and Gitea'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T00:47:00Z'
updated_date: '2026-10-29 22:50'
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
- [x] #1 A private repository syncs on GitLab with a deploy token, on GitHub with a fine-grained token, and on Forgejo or Gitea with an access token
- [x] #2 A wrong or revoked token shows a sync error at the source that contains no token
- [x] #3 Findings that differ per provider are documented in `docs/handbook/admin.md`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GitLab verified 2026-10-29 against a private repository on a self-hosted GitLab with a deploy token (username and token given by the user for the check only; not recorded anywhere, the test source was removed with make agent-reset and the check scripts deleted):
- Test connection with the deploy token: reachable, branch main at its commit. Creating the source synced it: 9 pages, 105 snippets, no warnings.
- Wrong token at Test connection, and a revoked token simulated by storing a rejected token encrypted and running Sync now: both answer 'git ls-remote failed: fatal: could not read Username for https://<host>: terminal prompts disabled'. Shown at the source and on the dashboard; neither token nor username appears on the page or in the server log.
- Documented in docs/handbook/admin.md under 'Tokens per Git host'.
Open: GitHub (fine-grained token) and Forgejo or Gitea (access token) need a private repository and a token each; AC 1 stays unchecked until they are verified. AC 2 holds for GitLab and is to be repeated per provider.

Forgejo verified 2026-10-29 against a private repository on a self-hosted Forgejo with an access token (credentials given by the user for the check only; not recorded, the test source removed with make agent-reset, the check script deleted):
- Test connection with the token: reachable, branch main at its commit. Creating the source synced it: 1 page, 1 snippet, no warnings.
- A rejected token at Test connection and as stored token with Sync now: the same message as GitLab, 'could not read Username for https://<host>: terminal prompts disabled'; neither token appears on the page or in the server log.
- Measured with git ls-remote and the Basic-auth header grimoire sends: Forgejo accepts the token with any username.
- Documented in docs/handbook/admin.md under 'Tokens per Git host'.
Open: GitHub with a fine-grained token. Gitea is covered by the 'Forgejo or Gitea' criterion through Forgejo; AC 1 stays unchecked until GitHub is verified.

GitHub verified 2026-10-29 against a private repository with a fine-grained personal access token (credentials given by the user for the check only; not recorded, the test source removed with make agent-reset, the check script deleted):
- Test connection: reachable, branch main at its commit. Creating the source synced it: 1 page, 1 snippet, no warnings.
- A rejected token at Test connection and as stored token with Sync now: the same message as GitLab and Forgejo; neither token appears on the page or in the server log.
- Measured with git ls-remote and the Basic-auth header grimoire sends: GitHub accepts the token with any username, like Forgejo; GitLab deploy tokens were used with their own username.
- Documented in docs/handbook/admin.md under 'Tokens per Git host'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Private repositories sync with the token type the admin area names for each host, checked by hand in the agent environment on 2026-10-29: GitLab with a deploy token, Forgejo with an access token (covering 'Forgejo or Gitea'), GitHub with a fine-grained personal access token. Each passed Test connection and synced on creation. A wrong token at Test connection and a rejected stored token at Sync now show the same message on all three, 'could not read Username for https://<host>: terminal prompts disabled', at the source and on the dashboard, without the token or username; the server log holds no token either. GitHub and Forgejo accept their token with any username.

docs/handbook/admin.md lists username and token per host and explains the refused-token message. No code change was needed. The credentials were provided for the check only and recorded nowhere; the test sources and scripts were removed.

Possible follow-up: translate Git's 'could not read Username … terminal prompts disabled' into a clear 'the Git server refused the username or token'.
<!-- SECTION:FINAL_SUMMARY:END -->

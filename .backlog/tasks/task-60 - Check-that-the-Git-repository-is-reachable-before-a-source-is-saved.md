---
id: TASK-60
title: Check that the Git repository is reachable before a source is saved
status: To Do
assignee: []
created_date: '2026-10-29 19:52'
updated_date: '2026-10-29 20:02'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/sync/git.ts
priority: medium
type: feature
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today a source is saved whatever its Git URL, branch or token is. A typo or a wrong token only shows as a sync error after saving. The admin wants to know before saving that grimoire can reach the repository.

Decided with the user:
- A "Test connection" button shows the result at any time.
- Saving runs the same check. When it fails, nothing is saved; there is no override.
- The check runs on the server, in a SvelteKit form action, through one function shared by the test and the save. The browser cannot run git, and the token must not leave the server.
- The check covers server, access and branch with `git ls-remote`, which feels instant. Whether the path exists still shows on the first sync.
- A save button that stays locked until a test passes was rejected: it needs JavaScript and can be bypassed without the server-side check anyway.
- A path check was considered and rejected because it is slower.

Measured when the task was planned (second run each):

| Repository | `ls-remote` | with path check | downloaded |
|---|---|---|---|
| grimoire-fixture-docs | 0.4 s | 1.1 s | 204 KB |
| mkdocs-material | 0.4 s | 1.1 s | 612 KB |
| Linux kernel | 0.7 s | 2.6 s | 3.4 MB |

The path check here was a clone without file contents (`git clone --filter=tree:0 --depth 1 --no-checkout`).

`remoteCommit` in `app/src/lib/server/sync/git.ts` already runs `ls-remote` with credentials, a timeout and redacted errors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source form and the source step of the project wizard have a "Test connection" button that works without JavaScript and keeps everything entered, the token included
- [ ] #2 Saving a source, and creating a project with its first source, runs the same check; when it fails, nothing is saved and the form shows the reason
- [ ] #3 No message, page or log line contains the token
- [ ] #4 One server-side function does the check for the test button and for saving; the browser runs no git and never receives the token
- [ ] #5 Tests cover success, each kind of failure and the skip for unchanged settings without a real network, with a local bare repository over file://
- [ ] #6 The test and the check on save are described in `docs/handbook/admin.md`
- [ ] #7 The test reports success with the commit the branch points to, or why it failed: server not reachable or no answer in time, access refused, branch not found
- [ ] #8 The check is skipped when nothing it depends on changed (Git URL, branch, username, token), so saving a name, a path, a schedule or the paused setting needs no network
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Changed with the user after creation: no 'Save anyway' override, and the path is checked too (measured cost in the description).

Changed again with the user: only server, access and branch (ls-remote), because it feels instant; the path shows on the first sync.
<!-- SECTION:NOTES:END -->

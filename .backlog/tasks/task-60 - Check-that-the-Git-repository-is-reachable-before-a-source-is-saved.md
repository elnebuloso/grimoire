---
id: TASK-60
title: Check that the Git repository is reachable before a source is saved
status: To Do
assignee: []
created_date: '2026-10-29 19:52'
updated_date: '2026-10-29 20:01'
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
Today a source is saved whatever its Git URL, branch, path or token is. A typo or a wrong token only shows as a sync error after saving. The admin wants to know before saving that grimoire can read the source.

Decided with the user:
- A "Test connection" button shows the result at any time.
- Saving runs the same check. When it fails, nothing is saved; there is no override.
- The check runs on the server, in a SvelteKit form action, through one function shared by the test and the save. The browser cannot run git, and the token must not leave the server.
- The check covers server, access, branch and path. It uses a clone without file contents and only the trees on the way to the path (`git clone --filter=tree:0 --depth 1 --no-checkout`, then the path looked up in the commit).
- A save button that stays locked until a test passes was rejected: it needs JavaScript and can be bypassed without the server-side check anyway.

Measured when the task was planned (second run each, the first Linux run hung on the network):

| Repository | `ls-remote` | with path check | downloaded |
|---|---|---|---|
| grimoire-fixture-docs | 0.4 s | 1.1 s | 204 KB |
| mkdocs-material | 0.4 s | 1.1 s | 612 KB |
| Linux kernel | 0.7 s | 2.6 s | 3.4 MB |

`app/src/lib/server/sync/git.ts` already runs git with credentials, a timeout and redacted errors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source form and the source step of the project wizard have a "Test connection" button that works without JavaScript and keeps everything entered, the token included
- [ ] #2 Saving a source, and creating a project with its first source, runs the same check; when it fails, nothing is saved and the form shows the reason
- [ ] #3 No message, page or log line contains the token
- [ ] #4 The test reports success with the commit the branch points to, or why it failed: server not reachable or no answer in time, access refused, branch not found, path not found in the branch
- [ ] #5 The check is skipped when nothing it depends on changed (Git URL, branch, path, username, token), so saving a name, a schedule or the paused setting needs no network
- [ ] #6 One server-side function does the check for the test button and for saving; the browser runs no git and never receives the token
- [ ] #7 Tests cover success, each kind of failure and the skip for unchanged settings without a real network, with a local bare repository over file://
- [ ] #8 The test and the check on save are described in `docs/handbook/admin.md`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Changed with the user after creation: no 'Save anyway' override, and the path is checked too (measured cost in the description).
<!-- SECTION:NOTES:END -->

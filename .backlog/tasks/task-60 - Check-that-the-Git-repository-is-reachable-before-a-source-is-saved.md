---
id: TASK-60
title: Check that the Git repository is reachable before a source is saved
status: To Do
assignee: []
created_date: '2026-10-29 19:52'
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
Today a source is saved whatever its Git URL, branch or token is, and a typo or a wrong token only shows as a sync error after saving. The admin wants to know before saving that grimoire can reach the repository.

Decided with the user:
- A "Test connection" button shows the result at any time.
- Saving runs the same check on the server. If it fails, nothing is saved, and the admin can still save with "Save anyway", for a repository that does not exist yet or a Git server under maintenance.
- The check covers server, access and branch (`git ls-remote` with the credentials of the source). Whether the path exists still shows on the first sync.
- Save is not locked until a test passes: such a lock needs JavaScript, can be bypassed without a server check, and leaves no way out while a server is down.

`remoteCommit` in `app/src/lib/server/sync/git.ts` already runs `ls-remote` with credentials, a timeout and redacted errors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source form and the source step of the project wizard have a "Test connection" button that works without JavaScript and keeps everything entered, the token included
- [ ] #2 The test reports success with the commit the branch points to, or why it failed: server not reachable or no answer in time, access refused, branch not found
- [ ] #3 Saving a source, and creating a project with its first source, runs the same check; when it fails, nothing is saved and the form shows the reason
- [ ] #4 After a failed check, a "Save anyway" checkbox lets the admin save regardless
- [ ] #5 The check is skipped when nothing it depends on changed (Git URL, branch, username, token), so saving a name or a schedule needs no network
- [ ] #6 No message, page or log line contains the token
- [ ] #7 Tests cover success, each kind of failure, the override, and the skip for unchanged settings without a real network (a local bare repository over file:// or a stubbed git call)
- [ ] #8 The test, the check on save and "Save anyway" are described in `docs/handbook/admin.md`
<!-- AC:END -->

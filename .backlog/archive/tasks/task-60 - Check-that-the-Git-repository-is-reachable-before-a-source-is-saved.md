---
id: TASK-60
title: Check that the Git repository is reachable before a source is saved
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 19:52'
updated_date: '2026-10-29 20:11'
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
- [x] #1 The source form and the source step of the project wizard have a "Test connection" button that works without JavaScript and keeps everything entered, the token included
- [x] #2 Saving a source, and creating a project with its first source, runs the same check; when it fails, nothing is saved and the form shows the reason
- [x] #3 No message, page or log line contains the token
- [x] #4 One server-side function does the check for the test button and for saving; the browser runs no git and never receives the token
- [x] #5 Tests cover success, each kind of failure and the skip for unchanged settings without a real network, with a local bare repository over file://
- [x] #6 The test and the check on save are described in `docs/handbook/admin.md`
- [x] #7 The test reports success with the commit the branch points to, or why it failed: server not reachable or no answer in time, access refused, branch not found
- [x] #8 The check is skipped when nothing it depends on changed (Git URL, branch, username, token), so saving a name, a path, a schedule or the paused setting needs no network
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git.ts: checkRemote(remote, branch, timeout) runs ls-remote and returns ok with the commit, no-branch, refused (access or repository not found: hosts answer both alike) or unreachable, with the redacted git message. remoteCommit uses it.
2. admin/source-access.ts: checkSourceAccess builds the remote from the form, using the stored token unless a new one is entered or removal is asked. It returns a translated result. accessChanged tells whether URL, branch, username or token differ from the stored source.
3. Routes: a test action on the source page and in the wizard. Save and wizard create run the check when access changed and refuse to save on failure. The source page carries an entered token encrypted, as the wizard does, so a test keeps it.
4. Messages en/de, handbook.
5. Tests: checkRemote and checkSourceAccess against a local bare repository over file://; route specs stub the check. The e2e server gets GIT_CONFIG_GLOBAL with url.insteadOf, mapping an https URL to a local bare repository, so the browser tests use real git without network.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Changed with the user after creation: no 'Save anyway' override, and the path is checked too (measured cost in the description).

Changed again with the user: only server, access and branch (ls-remote), because it feels instant; the path shows on the first sync.

Implementation notes:
- git.ts gains checkRemote, which classifies an ls-remote result as ok, no-branch, refused or unreachable. remoteCommit for the sync builds on it.
- admin/source-access.ts holds checkSourceAccess, the one function for the button and for saving. It uses a 15 s timeout and the stored token unless a new one is entered or its removal is asked for. accessChanged is the skip rule.
- The wizard checks on the way to the summary and again on create. A failure returns to the source step with the reason.
- The source page carries an entered token encrypted in a hidden field, so a test or a rejected save keeps it.
- Next or Save comes first in its form, because Enter submits with the first button.

e2e: playwright.config.ts creates a local bare repository plus a gitconfig that maps https://git.e2e.example/platform/{auth,missing}.git to local paths with url.insteadOf, set as GIT_CONFIG_GLOBAL for the test server. The tests use real git without network. The sync failure they rely on is now the missing docs/ path instead of an unresolvable host.

Verification:
- make lint, make test (380) and make e2e (14/14) pass. The wizard e2e covers a refused test, a refused Next, a reachable test that keeps the token, and creating.
- By hand against GitHub in the agent environment: main is reachable (0.47 s), develop is reported missing (0.41 s), an unknown repository is reported refused (0.25 s), and the German messages work. A save with a missing branch left the stored branch unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Before a source is saved, grimoire asks the Git server whether it can read it: server reachable, access accepted, branch present (git ls-remote, about half a second). A Test connection button on the source page and in the wizard's source step shows the result at any time, without JavaScript, and keeps an entered token encrypted. Saving runs the same server-side check whenever URL, branch, username or token changed; a failing check saves nothing and shows the reason, and there is no override. Other changes save without network. The token never reaches the browser or a message.

Covered by tests against local repositories (unit) and by e2e through url.insteadOf, so no test needs the network. Described in docs/handbook/admin.md.
<!-- SECTION:FINAL_SUMMARY:END -->

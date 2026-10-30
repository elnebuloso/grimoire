---
id: TASK-71
title: >-
  "Test access" sends the stored token to any URL and passes unchecked input to
  git
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/admin/source-access.ts
  - app/src/lib/server/sync/git.ts
  - app/src/lib/server/admin/projects.ts
priority: high
type: bug
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30 (read only, option injection not run).

Saving a source goes through `sourceProblem` (`app/src/lib/server/admin/projects.ts:278-287`), which runs `checkGitUrl` (https only, no credentials in the URL) and refuses to send a stored token to a changed origin. The "test access" actions skip both:

- `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts:134-139`
- `app/src/routes/manage/projects/new/+page.server.ts:109-119`

They call `checkSourceAccess` (`app/src/lib/server/admin/source-access.ts:51-66`), which decrypts the stored token and runs `git ls-remote <form URL>` with it as a Basic header (`checkRemote`, `app/src/lib/server/sync/git.ts:37`).

Consequences:
- Token leak: entering `https://attacker.example/x` on an existing source and pressing "test" sends its stored token there.
- Option injection: `ls-remote` gets the URL without a preceding `--`, so a value starting with `-` becomes an option, e.g. `--upload-pack=<command>`. Admin input becomes a possible shell command; this matters more once further roles (ADR 0003) exist.
- `file://` paths and internal hosts can be probed.

Review suggestion: apply the URL rules and the same-origin token rule for every caller, cheapest in `checkSourceAccess` itself, and put `--` before the URL in `checkRemote` as `sparseClone` already does.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testing access with a URL that `checkGitUrl` rejects (non-https, credentials in URL, leading `-`) returns the validation error and runs no git command
- [ ] #2 Testing access with a URL whose origin differs from the stored one does not send the stored token
- [ ] #3 `checkRemote` passes `--` before the URL
- [ ] #4 Tests cover each case for the source page and the project wizard
<!-- AC:END -->

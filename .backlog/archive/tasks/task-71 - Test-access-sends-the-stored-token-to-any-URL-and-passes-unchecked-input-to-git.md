---
id: TASK-71
title: >-
  "Test access" sends the stored token to any URL and passes unchecked input to
  git
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:25'
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
- [x] #1 Testing access with a URL that `checkGitUrl` rejects (non-https, credentials in URL, leading `-`) returns the validation error and runs no git command
- [x] #2 Testing access with a URL whose origin differs from the stored one does not send the stored token
- [x] #3 `checkRemote` passes `--` before the URL
- [x] #4 Tests cover each case for the source page and the project wizard
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract the Git URL rules and the same-origin token rule from sourceProblem into an exported remoteProblem in projects.ts; sourceProblem calls it.
2. checkSourceAccess runs remoteProblem first and contacts no server when it finds one. Both test actions (source page, wizard) go through checkSourceAccess, so one guard covers both.
3. checkRemote passes -- before the URL.
4. Tests: source-access.spec (rejected URLs, foreign origin with stored token), git.spec (option-like URL runs no command).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Option injection reproduced by hand: git ls-remote '--upload-pack=touch <marker> #' refs/heads/main created the marker; with -- git refuses the 'strange pathname'. The git.spec test fails without the -- and passes with it.

AC 4: the guard sits inside checkSourceAccess, which both test actions call (route tests in projects.spec.ts and wizard.spec.ts mock it and assert it is called), so the cases are tested once there rather than per route. source-access.spec now reaches its local bare repository through https://git.example/ (mocked checkRemote rewrites it to file://), since file:// is rejected now.

Checked in the agent environment: the test action with --upload-pack answers the Git URL error. A changed https URL on a source without stored token is still contacted, as intended (no secret involved).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
"Test access" now applies the same rules as saving before it contacts a Git server: https only, no credentials in the URL, and no stored token sent to another origin. remoteProblem in projects.ts holds those rules and both sourceProblem and checkSourceAccess use it. checkRemote now puts -- before the URL, which closes an option injection (--upload-pack=<command>) reproduced by hand. Verified by new tests in source-access.spec.ts and git.spec.ts (the git one fails before the fix), a curl check in the agent environment, make lint and make test (463 passed).
<!-- SECTION:FINAL_SUMMARY:END -->

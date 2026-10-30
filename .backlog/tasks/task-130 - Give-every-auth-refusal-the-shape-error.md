---
id: TASK-130
title: 'Give every auth refusal the shape { error }'
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:46'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. Commit `8fada93` gave the admin operations one result shape, `{ error }`. The auth code has drifted from it: `login` returns `{session} | {error}`; `setupAdmin`, `changePassword` and `resetPassword` return `AuthProblem | undefined`; `requestPasswordReset` in `app/src/lib/server/admin/password-reset.ts` (around line 43) returns `{to, token} | undefined | 'reset-blocked'`, a bare string next to an object. Every new auth route therefore reads differently. `auth.ts` is loaded by plain Node scripts, so refusals stay codes, not texts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every auth operation in `app/src/lib/server/admin/auth.ts` and `password-reset.ts` reports a refusal as `{ error: AuthProblem }` (or a code of that union)
- [ ] #2 Routes and `scripts/` that call them are adapted; shown texts are unchanged
- [ ] #3 Existing tests pass, adjusted only to the new shape
<!-- AC:END -->

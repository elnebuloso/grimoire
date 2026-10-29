---
id: TASK-44
title: 'Admin: create a project as a step-by-step wizard'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T01:04:00Z'
updated_date: '2026-10-29T01:56:00Z'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/admin/projects/[id]/+page.svelte
  - app/src/routes/admin/projects/[id]/sources/[sourceId]/+page.svelte
priority: medium
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creating a project today takes two separate stops: the form at `/admin/projects/new` saves only slug and short description, and the first source has to be added afterwards from the project page via "New source". A project without a source serves nothing, and nothing guides the operator from one step to the next. A wizard leads through project data and the first source in one flow.

Editing an existing project and its sources stays on the current pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Creating a new project leads through ordered steps: project data (slug, short description), first source (the fields of the source form), summary
- [x] #2 Each step validates its input before the next one opens; errors are shown in the step they belong to
- [x] #3 Going back to an earlier step keeps the values already entered, except the token, which is never rendered
- [x] #4 Nothing is written to the database before the summary step is confirmed; aborting the wizard leaves no project behind
- [x] #5 After confirming, the project and its first source exist and the operator lands on the project page
- [x] #6 The wizard works without client-side JavaScript (plain form posts)
- [x] #7 Unit tests cover the step validation and the final create; the Playwright e2e test for creating a project runs through the wizard
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Split `projectProblem` / `sourceProblem` out of `saveProject` / `saveSource` in `admin/projects.ts`, so a step can be validated without writing
2. `createProjectWithSource`: both inserts in one transaction
3. New route `/admin/projects/new` (static, wins over `[id]`): actions `project`, `source`, `summary`, `create`; the values of the other steps travel as hidden fields; the token travels encrypted with `TOKEN_ENCRYPTION_KEY` (`encryptedToken`), never as plain text
4. Remove the now unreachable `new` branch from the `[id]` project page
5. Unit tests for validation per step, token handling and create; e2e test runs through the wizard
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as planned. `projectProblem` / `sourceProblem` are split out of `saveProject` / `saveSource`, which now call them; `createProjectWithSource` wraps both inserts in `BEGIN IMMEDIATE`. The wizard keeps every value of the other steps in hidden fields; the token goes into the hidden field `encryptedToken` only as `encryptToken(token, TOKEN_ENCRYPTION_KEY)`, so the page never holds it in plain text, and is decrypted on create. If a slug was taken between summary and create, the wizard returns to the step the problem belongs to and writes nothing.

No-JS check by hand: production build on a fresh database, the steps posted with curl as `Accept: text/html` form posts: each step answered with its page, the summary held no plain token (grep: 0), create answered 303 to the project page and stored the source with its token.

Tests: `wizard.spec.ts` (8: step validation, back without validation, token carried encrypted / kept / removed, credentials in a rejected Git URL not sent back, nothing written before create, create with sync, slug taken meanwhile). `projects.spec.ts` now sets up projects in the database and checks that `/admin/projects/[id]` answers `new` with 404. e2e runs through the wizard including both Back steps. `make lint`, `make test` (296), `make e2e` (9), `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New projects are created in a three-step wizard at `/admin/projects/new`: project data, first source, summary. Steps are validated in order and errors shown in their step; Back keeps the values (the token stays, never rendered: it travels encrypted with `TOKEN_ENCRYPTION_KEY`); nothing is written until "Create project", which creates both in one transaction, starts the sync and opens the project page. Works as plain form posts (checked with curl against the production build). The project page `[id]` only edits now. Handbook `admin.md` describes the wizard.
<!-- SECTION:FINAL_SUMMARY:END -->

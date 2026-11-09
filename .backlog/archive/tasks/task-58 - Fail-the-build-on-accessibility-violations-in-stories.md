---
id: TASK-58
title: Fail the build on accessibility violations in stories
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 18:52'
updated_date: '2026-10-30 19:40'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-180
  - TASK-181
  - TASK-182
references:
  - app/.storybook/preview.ts
  - .claude/rules/ui-components.md
priority: medium
type: chore
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every story runs an accessibility check (axe, through `@storybook/addon-a11y`). `app/.storybook/preview.ts` sets `a11y: { test: 'todo' }`, so violations show only in the Storybook UI and never fail `make test` or CI. A component can therefore ship with a missing label or a wrong table header unnoticed. TASK-52 moves the building blocks of the routes into components with stories, so the stories will soon cover most of the UI. That makes the check worth enforcing before then.

When this task was created, the five `ProjectStatsTable` stories passed with `test: 'error'` already (checked with `npx vitest run --project storybook`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An accessibility violation in any story fails `make test` and the CI pipeline
- [x] #2 All stories pass the check, without rules switched off globally
- [x] #3 A rule switched off for a single story names its reason next to it
- [x] #4 `.claude/rules/ui-components.md` says that stories must pass the accessibility check
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/.storybook/preview.ts`: `a11y.test` from `'todo'` to `'error'`, so a violation fails the story test in `make test` and in CI (which runs `make test`).
2. Run every story; fix a violation in the component, switching a rule off only for a single story with its reason next to it.
3. Prove it bites: a story with a deliberate violation fails the run (temporary, not committed).
4. `.claude/rules/ui-components.md`: stories must pass the accessibility check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: this task starts only after TASK-37 (Finalize the frontend design). Only the agreed design brings colours, contrast and focus styles, which the strict check then judges as well.

Order changed with the user: this task now starts after the design tasks TASK-178 to TASK-182 (all colours, contrast and focus styles are in place by then) and before the final acceptance in TASK-37, which depends on it.

`app/.storybook/preview.ts`: `a11y: { test: 'error' }`. CI runs `make test` (`.github/workflows/ci.yml`), which includes the storybook project, so the same check fails CI.
All 49 stories pass with no rule switched off anywhere, so AC #3 holds trivially; the rule in `ui-components.md` says how to do it should one ever be needed.
Proved it bites: a temporary story with an unlabelled input failed with "Form elements must have labels (label)"; removed again, not committed.
make lint, make test (685) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Accessibility violations in stories now fail `make test` and CI (`a11y.test: 'error'`). All 49 stories pass without any rule switched off; a deliberately broken story was shown to fail. `ui-components.md` requires stories to pass the check and allows switching a rule off only per story with its reason.
<!-- SECTION:FINAL_SUMMARY:END -->

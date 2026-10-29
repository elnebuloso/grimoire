---
id: TASK-58
title: Fail the build on accessibility violations in stories
status: To Do
assignee: []
created_date: '2026-10-29 18:52'
updated_date: '2026-10-29 23:44'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-37
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
- [ ] #1 An accessibility violation in any story fails `make test` and the CI pipeline
- [ ] #2 All stories pass the check, without rules switched off globally
- [ ] #3 A rule switched off for a single story names its reason next to it
- [ ] #4 `.claude/rules/ui-components.md` says that stories must pass the accessibility check
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: this task starts only after TASK-37 (Finalize the frontend design). Only the agreed design brings colours, contrast and focus styles, which the strict check then judges as well.
<!-- SECTION:NOTES:END -->

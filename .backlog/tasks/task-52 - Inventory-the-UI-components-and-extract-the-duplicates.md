---
id: TASK-52
title: Inventory the UI components and extract the duplicates
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:55:00Z'
updated_date: '2026-10-29 19:00'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-51
references:
  - app/src/routes
  - app/src/lib/components
priority: medium
type: task
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Most markup still lives in the routes under `app/src/routes`, so the same building blocks (form fields with their error message, status lists, tables, confirm buttons) are likely written several times. Nobody knows which ones exist, which makes it impossible to tell a developer to reuse one. An inventory names them; extracting the duplicates gives the component catalog from TASK-51 its content and gives the coming design system one place per building block to apply to.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An inventory lists every UI building block found in `app/src/routes`, with the routes that use it and whether it repeats
- [x] #2 Every building block that repeats is a shared component in `app/src/lib/components` with stories, and all routes that used it use the component
- [x] #3 Building blocks used only once stay in their route and are marked so in the inventory
- [x] #4 The pages render and behave as before: `make test` and `make e2e` pass without changing what they assert
- [x] #5 The inventory is kept where the developer guide from TASK-51 lives
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory every building block in app/src/routes (routes, repeats or not) in docs/components.md, next to the developer guide. A building block is a group of elements with its own structure or behaviour; a single element (a back link, an empty-state sentence) is not one, and the inventory says so.
2. Extract the repeating ones into app/src/lib/components, each with stories that check their states in play: FormError, TextField, TextAreaField, ChoiceField (checkbox/radio), ConfirmForm, DescriptionList.
3. Replace them in every route without changing the rendered structure (p > label > input), so make test and make e2e pass unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Six building blocks repeat: FormError (7 pages), TextField (7), TextAreaField (2), ChoiceField (3), ConfirmForm (3) and DescriptionList (3). Each is a component with stories, 15 new stories, 20 in total. The ones that take input (TextField, TextAreaField, ChoiceField, ConfirmForm) have interaction tests: typing, clicking, and confirming or cancelling the question. Single elements (back link, empty-state sentence, status message) are not counted as building blocks.

Prettier rewrote a single-quoted attribute that contained double quotes into an invalid one. The paused label therefore uses &quot; in a plain attribute.

Verification:
- make lint and make test (323, of them 20 stories) pass.
- make e2e passes (11/11).
- git diff on *.spec.ts and *.e2e.ts is empty.
- The server-rendered HTML of every admin page, both wizard steps and the login page was captured in the agent environment with the old and the new routes, the old ones via git stash. With the same data, the only differences are attribute order (type before name on one checkbox) and whitespace.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
docs/components.md now holds an inventory of every building block in app/src/routes: where it is used, whether it repeats, and which component replaces it. The six repeating ones are shared components with stories in app/src/lib/components: FormError, TextField, TextAreaField, ChoiceField, ConfirmForm and DescriptionList. All routes use them. Blocks used once stay in their route and are marked so; single elements do not count as building blocks.

The pages render as before: the server-rendered HTML was compared page by page with equal data. make test and make e2e pass without changes to what they assert. The inventory sits next to the developer guide from TASK-51.
<!-- SECTION:FINAL_SUMMARY:END -->

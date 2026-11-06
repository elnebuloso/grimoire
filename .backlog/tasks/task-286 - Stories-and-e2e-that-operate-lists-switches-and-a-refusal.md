---
id: TASK-286
title: 'Stories and e2e that operate lists, switches and a refusal'
status: To Do
assignee: []
created_date: '2026-11-06 15:58'
labels: []
dependencies: []
priority: medium
type: task
ordinal: 348000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ui-components rule asks that input, toggles and form state are checked by clicking and typing as a user would. Where behaviour lives in the browser, that does not happen:
- `DataTable` (`show()`, `sortBy()`, `searchFor()`, paging) is used by seven pages; its three stories only render. `list.spec.ts` tests only the server reading of the URL; nothing checks that what the table writes is what `readListParams` reads.
- `SegmentedSwitch` (language and theme) stories never click; the `onpick` spy is never asserted, so `pick()` runs in no story. `Preferences.stories.svelte` wraps the same switch and does not click either.
- `ConfirmAction` never receives an action result in stories (Storybook `enhance` stand-in emits `storybook:enhance` instead of posting), and the e2e uses it only on success paths.

Storybook SvelteKit framework lets a story replace `goto` (`parameters.sveltekit_experimental.navigation`); from its documentation, not tried here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `DataTable` stories type in the search, sort and page, and assert the resulting URL
- [ ] #2 `SegmentedSwitch` and `Preferences` stories click and assert the pick
- [ ] #3 An e2e step triggers a refusal through a `ConfirmAction`, e.g. demoting the only admin in `manage.e2e.ts`, and asserts the message in the dialog
<!-- AC:END -->

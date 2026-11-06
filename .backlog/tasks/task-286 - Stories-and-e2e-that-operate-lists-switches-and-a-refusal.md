---
id: TASK-286
title: 'Stories and e2e that operate lists, switches and a refusal'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:58'
updated_date: '2026-11-06 18:39'
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
- [x] #1 `DataTable` stories type in the search, sort and page, and assert the resulting URL
- [x] #2 `SegmentedSwitch` and `Preferences` stories click and assert the pick
- [x] #3 An e2e step triggers a refusal through a `ConfirmAction`, e.g. demoting the only admin in `manage.e2e.ts`, and asserts the message in the dialog
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. DataTable story types in the search, picks a filter, sorts both ways and pages, records the URLs from Storybook's storybook:goto event and reads them with readListParams
2. SegmentedSwitch and Preferences stories click an option (fetch answered) and assert the pick: onpick with the value and the posted form; data-theme on <html>
3. manage.e2e demotes the only admin through its ConfirmAction and asserts the refusal in the open dialog
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Storybook's $app/navigation stand-in dispatches a storybook:goto event with goto's arguments; the story listens to it instead of a parameter.
- Stories (DataTable, SegmentedSwitch, Preferences) and manage.e2e pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stories now operate what lives in the browser: the DataTable story types, filters, sorts and pages and checks that readListParams reads what the table writes; the SegmentedSwitch and Preferences stories click and assert the pick. manage.e2e triggers a refusal through a ConfirmAction (demoting the only admin) and checks the message in the dialog.
<!-- SECTION:FINAL_SUMMARY:END -->

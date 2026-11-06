---
id: TASK-296
title: Split the source page into tab components
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 16:00'
updated_date: '2026-11-06 19:16'
labels:
  - admin
dependencies: []
priority: low
type: task
ordinal: 358000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.svelte` is one 721-line component: the header with "Sync now", the status, pages (with preview), history and settings tabs, the danger zone, a sync-pending poller, a redirect for old `#settings` links, and a settings form with its own protocol (test or save told apart by `input.action.search`, a public-visibility confirmation that cancels the submit and replays it through `requestSubmit`, the token field cleared after every answer). The settings form is a snippet rendered for the new-source page and the Settings tab.

A change to one tab means reading all of them, and the parts share state (`values` falls back across `form` from any action; the poller `refreshAll` reruns the load for whatever tab shows). The save-confirm-resubmit flow is the most fragile part and has no story because it is not a component.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each tab is a route-local component
- [x] #2 The settings form with public confirmation and token handling is one component with stories covering test, save, the public confirmation and its cancel
- [x] #3 The poller lives in its own small module
- [x] #4 `manage.e2e.ts` passes unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Route-local StatusTab, PagesTab, HistoryTab and SettingsTab (form plus danger zone) beside +page.svelte, which keeps the head, the tab bar, the poller and the old #settings redirect
2. SourceSettingsForm in lib/components: settings form, connection test, public confirmation (in its own submit handler before enhance's) and token clearing; used by the settings tab and the new-source page
3. sync-poll.ts holds the poll for the end of a queued sync
4. Stories for test, save, the public confirmation and its cancel, the overlap and a path refusal
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The public confirmation moved from the enhance submit function to an onsubmit handler that runs first and stops enhance's listener until confirmed; that is what lets stories exercise it, since Storybook's enhance stand-in never calls the submit function (it dispatches storybook:enhance, which the stories record).
- The form is a shared component because stories exist only under lib/components (.storybook/main.ts); the tabs stay route-local.
- manage.e2e unchanged passes (one flaky step from TASK-289/270 fixed in its own commit before). Checked by hand: every tab, the preview, the new-source page, the public confirmation, and /manage/sources/1#settings leading to the Settings tab.
- +page.svelte is down from 757 to 176 lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source page is split: each tab is a route-local component, the settings form with its public confirmation and token handling is the SourceSettingsForm component with stories for test, save, the public confirmation and its cancel, and the sync poller lives in sync-poll.ts. +page.svelte keeps only the head, tabs and routing (757 → 176 lines). manage.e2e passes unchanged; checked by hand in the browser.
<!-- SECTION:FINAL_SUMMARY:END -->

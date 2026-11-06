---
id: TASK-296
title: Split the source page into tab components
status: To Do
assignee: []
created_date: '2026-11-06 16:00'
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
- [ ] #1 Each tab is a route-local component
- [ ] #2 The settings form with public confirmation and token handling is one component with stories covering test, save, the public confirmation and its cancel
- [ ] #3 The poller lives in its own small module
- [ ] #4 `manage.e2e.ts` passes unchanged
<!-- AC:END -->

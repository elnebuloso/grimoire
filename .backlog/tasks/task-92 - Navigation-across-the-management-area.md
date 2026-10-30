---
id: TASK-92
title: Navigation across the management area
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:05'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: enhancement
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The links to API keys, password and settings exist only on `/manage`. Every other management page offers just a link back, so moving from a source to the API keys takes a detour through the start page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every page under `/manage` shows the same navigation to the overview, API keys, settings and the account page
- [x] #2 The current page is marked with `aria-current="page"`
- [x] #3 All texts are messages in every `app/messages/<locale>.json`
- [x] #4 An e2e or story test checks that the navigation is present and marks the current page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/src/routes/manage/+layout.svelte renders a <nav> (overview, API keys, settings, account) above every /manage page, marking the current page with aria-current=page.
2. Drop the link row on /manage and the back links on api-keys and settings, which the nav replaces; project and source pages keep their link to the parent.
3. Nav label as a message in en.json and de.json.
4. e2e test: the nav is on a management page and marks it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Nav lives in app/src/routes/manage/+layout.svelte (one user, so no component). It replaces the link row on /manage and the back links on api-keys and settings; project and source pages keep their link to the parent. Verified: make lint, make e2e (new test 'leads through the management area with one navigation that marks the current page').
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every page under /manage now starts with a navigation (overview, API keys, settings, password) labelled 'Management'; the current page carries aria-current=page. The link row on the overview and the back links on API keys and settings are gone, as the nav covers them. Verified with make lint and make e2e (16 passed).
<!-- SECTION:FINAL_SUMMARY:END -->

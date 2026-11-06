---
id: TASK-291
title: 'Language and theme switch: report failures, drop the no-JavaScript test'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 17:33'
labels: []
dependencies: []
priority: low
type: bug
ordinal: 353000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`SegmentedSwitch.svelte` applies the choice only on an OK answer or a redirect; any other answer does nothing, and a failed `fetch` rejects unhandled. The button simply does not take effect.

`theme.e2e.ts` opens a context with `javaScriptEnabled: false` and clicks the switch so the native form POST sets the cookie, and `manage.e2e.ts` justifies a server-side check with "for a reader without JavaScript". The ui-components rule says no fallback for missing JavaScript is kept or tested. What the theme test really protects (the first response already carries `data-theme`, no flash before hydration) stays inside the rule.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A failed answer or network error of the switch shows an error toast
- [x] #2 `theme.e2e.ts` sets the theme cookie with `context.addCookies` and still checks `data-theme` on the first response; no e2e runs with JavaScript disabled
- [x] #3 The "reader without JavaScript" comment in `manage.e2e.ts` is reworded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SegmentedSwitch shows a toast for any answer that is neither OK nor a redirect, and for a failed fetch; story with fetch rejected
2. theme.e2e sets the theme cookie with addCookies and checks data-theme in the first response; no context without JavaScript
3. Reword the comment in manage.e2e
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The toast system has no separate error style; the failure is a toast with its own message (switch_failed), as the criterion asks.
- New story 'A choice the server does not take' (fetch rejected) checks the toast and that onpick does not run; theme.e2e passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The language and theme switch now reports a failed answer or network error in a toast instead of doing nothing. theme.e2e no longer runs without JavaScript: it sets the theme cookie with addCookies and checks that the first response already carries data-theme. The no-JavaScript comment in manage.e2e is reworded.
<!-- SECTION:FINAL_SUMMARY:END -->

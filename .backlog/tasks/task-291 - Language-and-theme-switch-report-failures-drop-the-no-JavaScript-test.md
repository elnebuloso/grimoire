---
id: TASK-291
title: 'Language and theme switch: report failures, drop the no-JavaScript test'
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
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
- [ ] #1 A failed answer or network error of the switch shows an error toast
- [ ] #2 `theme.e2e.ts` sets the theme cookie with `context.addCookies` and still checks `data-theme` on the first response; no e2e runs with JavaScript disabled
- [ ] #3 The "reader without JavaScript" comment in `manage.e2e.ts` is reworded
<!-- AC:END -->

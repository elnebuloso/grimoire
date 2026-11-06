---
id: TASK-292
title: >-
  Frontend cleanups: unused messages, stale comment, PageList fallback,
  Paraglide strategy, radius tokens
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
labels: []
dependencies: []
priority: low
type: chore
ordinal: 354000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Small leftovers in the web UI:
- `source_sync_pending`, `source_sync_pending_reload` and `users_keys_named` are unused in both locales (no `m.` reference in `app/src`).
- `app/src/routes/manage/duplicates/+page.server.ts` says the list "names private sources of every user"; private sources and owners were removed in `a6318fa`.
- `PageList.svelte` keeps a fallback for pages without JavaScript (the filter appears only after `onMount`); the ui-components rule says no such fallback is kept.
- The Paraglide strategy is written in `app/vite.config.ts` for the build and in the `paraglide` script of `app/package.json`, which `make lint` compiles before `svelte-check`; changing one leaves type checking against another runtime.
- Radii off the token scale (`--r-sheet` 12 px, `--r-control` 8 px, `--r-small` 6 px in `app/src/app.css`): 10 and 7 px in `AreaSwitch.svelte` and `SegmentedSwitch.svelte`, 9 px in `TabNav.svelte` and `manage/+layout.svelte`. The rule names radii among token-only values.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The three unused messages are removed from every message file
- [ ] #2 The stale comment on the duplicates page is corrected
- [ ] #3 `PageList` shows its filter without waiting for `onMount`
- [ ] #4 The Paraglide strategy is defined in one place
- [ ] #5 The switches and the tab bar use radius tokens only; checked in light and dark
<!-- AC:END -->

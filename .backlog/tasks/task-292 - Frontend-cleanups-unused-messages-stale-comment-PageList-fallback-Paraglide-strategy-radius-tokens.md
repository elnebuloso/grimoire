---
id: TASK-292
title: >-
  Frontend cleanups: unused messages, stale comment, PageList fallback,
  Paraglide strategy, radius tokens
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 18:20'
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
- [x] #1 The three unused messages are removed from every message file
- [x] #2 The stale comment on the duplicates page is corrected
- [x] #3 `PageList` shows its filter without waiting for `onMount`
- [x] #4 The Paraglide strategy is defined in one place
- [x] #5 The switches and the tab bar use radius tokens only; checked in light and dark
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove source_sync_pending, source_sync_pending_reload, users_keys_named from en and de
2. Correct the duplicates page comment
3. PageList shows its filter from the start
4. Paraglide options in app/paraglide.config.ts, used by vite.config.ts and the paraglide script (compile API)
5. Switches and tab bars use --r-control (outer, tabs) and --r-small (inner buttons)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The paraglide script now calls compile() from @inlang/paraglide-js with the shared options; its output matched the CLI's except the source path in the generated README. make lint (which runs it) passes.
- Radii: 10 px tracks became --r-control (8), 7 px buttons --r-small (6), the 9 px tab items --r-control (8); the 999px pill counts are a shape, not a scale value, and stay. Checked the source page in light and dark.
- PageList, AreaSwitch, SegmentedSwitch and TabNav stories pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Frontend cleanups: three unused messages removed, the stale duplicates comment corrected, PageList shows its filter without waiting for onMount, the Paraglide compile options live in one file used by the build and the lint step, and the switches and tab bars use radius tokens only. Stories and make lint pass; checked in light and dark.
<!-- SECTION:FINAL_SUMMARY:END -->

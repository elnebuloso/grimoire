---
id: TASK-53
title: Develop the frontend design from mockups
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:55:00Z'
updated_date: '2026-10-30 18:28'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - .claude/rules/until-v1.md
priority: medium
type: task
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The frontend has no visual design yet: until one is agreed, it is built with browser defaults only (`.claude/rules/until-v1.md`, section "Frontend: function first"). A design described in words or shown as static pictures is hard to judge, so the developer chooses among working mockups instead, in as many rounds as it takes, and the chosen one becomes the template that TASK-37 implements.

The mockups are separate from `app/`: they imitate the current behaviour but do not change the product, so the function-first rule for the frontend stays in force until TASK-37.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each round offers the developer a proposed number of independent mockups, each in a clearly different direction or, after the first round, a different variation of the chosen one
- [x] #2 Every mockup opens in the browser and is fully usable: every page of the current UI (start page, setup, login, forgot password, password reset, account, error page, and in the management area the overview, source detail with page preview, new source, try a query, queries without results, API keys, settings and dead links) with its states, including empty, error and validation states
- [x] #3 The mockups mirror the current behaviour of the UI: the same pages, fields, steps and messages, without inventing features
- [x] #4 After each round the developer picks a direction, and the choice and feedback are recorded in this task's notes before the next round starts
- [x] #5 The rounds end when the developer declares the design agreed
- [x] #6 The agreed design is usable as a template for implementation: its design decisions (colours, typography, spacing, components, light and dark variant) are kept in `docs/design.md`; the mockups themselves stay local in `docs/mockups/`, which git ignores
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ignore `docs/mockups/` in git.
2. Layout: `docs/mockups/<line>/<stage>/` (e.g. `a/1`, `b/2`), one full copy of plain HTML and CSS per stage, an overview at `docs/mockups/index.html`, and `docs/mockups/_shared/mockup.js` as the only script: a theme switch (system / light / dark, kept in `localStorage`, set before first paint, as TASK-50 describes) and a bar that switches the states of a page via `?state=`.
3. Content follows the current routes and `app/messages/en.json` verbatim, with the fixture data of the agent environment; English only.
4. Round 1: three lines – a calm/editorial, b technical/industrial, c product console with sidebar.
5. Check every stage with Playwright in light and dark: links, states, theme persistence, contrast (WCAG AA).
6. Record choice and feedback per round in the notes; next stage as a copy of the chosen one.
7. Once the developer agrees the design, write `docs/design.md` and finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Round 1 started: shared tooling `docs/mockups/_shared/mockup.js` (theme switch system/light/dark, state bar via `?state=`) and the binding page/state/text spec `docs/mockups/_shared/SPEC.md`, both git-ignored like the rest of `docs/mockups/`. Lines a/1 (calm, editorial), b/1 (technical, industrial), c/1 (product console) in progress.

Round 1 built: a/1, b/1, c/1. Checked with Playwright over a local server (`python3 -m http.server` in `docs/mockups/`; browsers block file:// for the scripts): all 15 pages x all states (60 per line) in light and dark without console errors, failed requests, horizontal overflow or missing h1; theme choice kept across pages; no overflow at 390px. Known gaps for the next stage: preview showed a billing-docs page on platform-docs and the overview counted 1 API key while the list shows 2 (both fixed in SPEC.md); no state yet for the global-pause polling text, the stored-token labels, sync warnings, PageList no-match and CopyButton results. Waiting for the developer's choice.

Round 1 feedback: a/1 rejected, b/1 rejected, c/1 not judged. Next: three new directions d/1, e/1, f/1, built with the `ui-ux-pro-max` skill as the style source, without generic "AI UI" patterns.

Round 2 built: d/1 (Swiss Modernism 2.0), e/1 (Soft UI Evolution), f/1 (Flat Design), each from the `ui-ux-pro-max` style catalog with an explicit anti-slop brief. Checked with Playwright: all pages x states in light and dark, contrast of every visible text measured (WCAG AA, 0 failures with transitions disabled), theme kept across pages, no horizontal overflow at 1366 and 390 px. Fixed during the check: f/1 had its two font files swapped (body text rendered in mono) and its source page overflowed at 390 px. Waiting for the developer's choice.

Round 2 choice: the developer likes e/1 (Soft UI Evolution) best. d/1 and f/1 are not pursued; e is the line to develop.

Round 3 requested: e/2 = e/1 refined with the missing states (global pause, never synced, sync warnings, stored/entered token, empty page filter, copy status; added to SPEC.md); variations of e/2 with one change each: e/3 sidebar navigation, e/4 denser, e/5 different accent, e/6 cooler palette.

Round 3 built: e/2 (all missing states, dark input border raised to 3:1 on raised surfaces), e/3 sidebar nav (CSS only), e/4 denser (spacing 2-32, controls 34px, 44px on coarse pointers), e/5 ink-blue accent (#2A4596 / #9FB5F2; ochre rejected as too close to the warning colour), e/6 cool neutrals with petrol shifted to #0C5876 / #7FC2DD. Playwright: 690 page states in light and dark, 0 contrast failures, no overflow at 390, 900 and 1366 px, theme kept across pages. Waiting for the developer's choice.

Round 3 choice: the developer chose e/6 ("e/6 ist meine Entscheidung") and with it ends the rounds. Its design decisions are written to `docs/design.md`; the mockups stay local in `docs/mockups/`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Found grimoire's visual design through clickable mockups in three rounds. Round 1 offered three directions (a editorial, b industrial, c product console); a and b were rejected. Round 2 offered three directions from the `ui-ux-pro-max` style catalog (d Swiss Modernism 2.0, e Soft UI Evolution, f Flat Design); the developer chose e. Round 3 offered e/2 (all states) and four single-change variations; the developer chose e/6, cool neutrals with a petrol accent.

Result: `docs/design.md` holds colours (light and dark tokens), typography (IBM Plex Sans/Mono), spacing, depth, motion, the theme switch behaviour and the component rules, as the template for TASK-37 and TASK-50. The mockups themselves (`docs/mockups/`, git-ignored) mirror every page and state of the current UI from `docs/mockups/_shared/SPEC.md`; open them over a local server (`cd docs/mockups && python3 -m http.server 8765`), since browsers block their script over file://.

Verification: every round was checked with Playwright over all pages and states in light and dark (690 page states in round 3): measured text contrast at WCAG AA with 0 failures, no horizontal overflow at 390, 900 and 1366 px, theme choice kept across pages, no broken links.

Risk: the mockups exist only on this machine; `docs/design.md` is the lasting record.
<!-- SECTION:FINAL_SUMMARY:END -->

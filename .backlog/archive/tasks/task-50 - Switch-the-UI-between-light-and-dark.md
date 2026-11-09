---
id: TASK-50
title: Switch the UI between light and dark
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:46:00Z'
updated_date: '2026-10-30 19:36'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-179
documentation:
  - docs/design.md
priority: low
type: feature
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want the UI to match their surroundings and the rest of their desktop: light or dark, following the operating system unless they pick one themselves.

The colours of both variants come from `docs/design.md`, which TASK-178 already turns into tokens: they follow `prefers-color-scheme` and honour `data-theme="light"` / `data-theme="dark"` on `<html>`. The switch belongs in the header next to the language switch, which TASK-179 styles as a segmented track; the theme switch with "System", "Light" and "Dark" is the second such track, and with it the track becomes a component in `app/src/lib/components/` with stories (`.claude/rules/ui-components.md`). The mockup e/6 already tries out the behaviour: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Without an active choice, the UI follows the colour scheme of the operating system (`prefers-color-scheme`), and changes with it
- [x] #2 A scheme the user picked actively is kept across pages and visits and takes precedence over the system setting
- [x] #3 The user can go back from an active choice to following the system
- [x] #4 Every page offers a way to switch that works without JavaScript
- [x] #5 A page loads in the chosen scheme from the first paint, without flashing the other one
- [x] #6 Tests cover the system default, the active choice taking precedence, and going back to the system setting
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `#lib/theme.ts`: cookie name, the two stored schemes, and `themeAttribute(cookie)` that turns the cookie into the `data-theme` attribute (empty for none or an unknown value).
2. `POST /theme` (like `/language`): "light"/"dark" stores the cookie for 400 days, "system" deletes it; back to the page it came from. The open-redirect guard `pathOnThisSite` moves to `#lib/server/` as its second user arrives.
3. `hooks.server.ts`: a `handleTheme` writes the attribute into `app.html` (`%grimoire.theme%` on `<html>`), so the page is in the chosen scheme from the first byte, without script; `prefers-color-scheme` keeps working when there is none.
4. `SegmentedSwitch` component (label, POST action, options, current) with stories; the header uses it for Language and Theme ("System", "Light", "Dark"; messages in en and de). The layout load passes the current choice.
5. Tests: unit tests for `themeAttribute` and `POST /theme` (stores, deletes on System, ignores unknown values, redirect guard); an e2e test: system default follows the emulated scheme, a choice wins over it and holds on another page and after a reload, System returns to following the system; switching with JavaScript off.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The choice lives in the cookie `grimoire-theme` (400 days, `httpOnly`, `SameSite=Lax`); "System" deletes it. The server hook `handleTheme` writes `data-theme` into `<html>` via the `%grimoire.theme%` placeholder in `app.html`, so the first byte already carries the scheme – no script, no flash. Without the cookie the CSS follows `prefers-color-scheme`, live.
`pathOnThisSite` moved from the language endpoint to `#lib/server/path-on-this-site.ts` now that `/theme` needs it too; the language tests still cover it.
`SegmentedSwitch` replaces the language form markup in the layout and serves both switches (stories: following the system, a picked option, options in their own language).
Tests: `src/lib/theme.spec.ts` (attribute, unknown/injected values ignored), `src/routes/theme/theme.spec.ts` (stores light/dark, deletes on System, ignores unknown, redirect guard), `src/routes/theme.e2e.ts` (system default and its live change, choice wins over a dark system and is kept across pages and a reload, System follows the system again; with JavaScript off the switch works and the HTML response already carries `data-theme="dark"`).
Handbook: one line in `docs/handbook/admin.md` next to the language switch.
make lint, make test (685), make e2e (20); axe over all 49 stories in both schemes and the header pages at 390/1366: no violations, no overflow.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the theme switch: "System", "Light" and "Dark" in the header next to the language switch, both now built from the new `SegmentedSwitch` component. A choice is a plain form POST to `/theme` that stores a cookie (System deletes it); the server renders `data-theme` into the page, so it paints in the chosen scheme from the first byte and works without JavaScript. Without a choice the UI follows the system scheme and its changes. Covered by unit tests and an e2e test for default, precedence, persistence, going back and no-JavaScript; handbook line added.
<!-- SECTION:FINAL_SUMMARY:END -->

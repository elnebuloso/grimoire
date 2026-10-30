---
id: TASK-178
title: Lay the foundation of the agreed design
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 18:35'
updated_date: '2026-10-30 18:43'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - .claude/rules/until-v1.md
  - .claude/rules/ui-components.md
  - app/.storybook/preview.ts
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 240000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The visual design is agreed: the developer chose mockup e/6, and `docs/design.md` records every value and rule of it (colour tokens for light and dark, typography, spacing, depth, motion, components). Until now `app/` was built function-first with browser defaults only and has no CSS at all, so pages and components cannot be styled before a shared base exists: the tokens, the fonts and the stylesheet that both the app and Storybook load. The function-first rule ends with the agreement, so the rules have to say how styling is done from now on.

`docs/design.md` is the binding source. The mockup e/6 is a local visual reference only (git-ignored, on the developer machine): `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; it shows every page and state, switchable via the bar at the bottom right.

The theme switch itself (choice, persistence, no flash) is TASK-50; this task only makes both schemes render, following the system by default and `data-theme` when set.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The section "Frontend: function first" is removed from `.claude/rules/until-v1.md`
- [x] #2 `.claude/rules/ui-components.md` states how styling is done: colours and other design values only through the tokens of `docs/design.md`, no raw colour values in components or pages, component styles in the component's own `<style>` block
- [x] #3 One global stylesheet defines every token of `docs/design.md` with `light-dark()`, follows `prefers-color-scheme` by default and honours `data-theme="light"` / `data-theme="dark"` on `<html>`
- [x] #4 The global stylesheet sets the base of `docs/design.md`: body typography, headings, the focus ring, transitions that drop to 0 under `prefers-reduced-motion`, and 44px controls under `pointer: coarse`
- [x] #5 IBM Plex Sans and IBM Plex Mono are self-hosted with the weights `docs/design.md` names; no page loads anything from a font CDN
- [x] #6 Storybook loads the same global stylesheet and can show every story in light and in dark
- [x] #7 `make lint`, `make test`, `make build` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rules: delete the section "Frontend: function first" from `.claude/rules/until-v1.md`; add a "Styling" section to `.claude/rules/ui-components.md` (tokens only, no raw colours, global stylesheet for tokens/base/shared page primitives, component styles in the component's `<style>` block).
2. Fonts: copy the IBM Plex Sans 400/500/600 and Plex Mono 400/500 latin woff2 files plus `OFL.txt` from mockup e/6 into `app/src/lib/assets/fonts/`, declared with `@font-face` in the global stylesheet; Vite bundles them, no CDN.
3. `app/src/app.css`: every colour token of `docs/design.md` with `light-dark()`, `color-scheme` on `:root` and `[data-theme]`, shadows, spacing, radii, motion; base: body type, headings, links, focus ring, reduced motion, 44px controls under `pointer: coarse`, native controls (inputs, buttons, tables, pre, fieldset, details).
4. Import it once in `app/src/routes/+layout.svelte` and in `app/.storybook/preview.ts`; add a Storybook toolbar global "Theme" (System/Light/Dark) whose decorator sets `data-theme` on `<html>`.
5. Verify: `make lint`, `make test`, `make build`, `make e2e`; check in the agent environment that fonts load from the app origin and both schemes render.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fonts: the woff2 files of mockup e/6 (latin subset, fontsource builds of IBM Plex) with OFL.txt in `app/src/lib/assets/fonts/`; Vite fingerprints them into `_app/immutable/assets/`, the agent environment loads all five from its own origin.
Global stylesheet `app/src/app.css`, imported in `app/src/routes/+layout.svelte` and `app/.storybook/preview.ts`. Besides tokens and base it holds the page primitives `.sheet` (+ `.sheet-head`, `.flush`), `.notice` (+ `.warn`, `.alert`), `.table-scroll` and `.muted`, which every later page uses; the rule in `ui-components.md` names exactly these.
Native `button` is the secondary button; `.primary` and `.danger` are the variants.
Storybook: toolbar global "Theme" (System/Light/Dark), the decorator sets or removes `data-theme` on `<html>`; checked: `globals=theme:light` renders light under a dark system and vice versa.
Checked in the agent environment: system dark/light and `data-theme` both ways switch `--canvas`.
make lint, make test (664), make build, make e2e (18) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Laid the base of the agreed design (`docs/design.md`, mockup e/6): `app/src/app.css` with every colour token as `light-dark()` (system by default, `data-theme` wins), shadows, spacing, radii, motion (0 under reduced motion), focus ring, 44px controls on coarse pointers, base styles of native elements and the shared page primitives; IBM Plex Sans/Mono self-hosted. Both the app and Storybook load it; Storybook has a Theme toolbar. The function-first rule is gone from `until-v1.md`; `ui-components.md` now says how styling is done. Pages still look unstyled in their arrangement until TASK-179 to TASK-182. Verified: lint, test, build, e2e; schemes and fonts checked in the browser.
<!-- SECTION:FINAL_SUMMARY:END -->

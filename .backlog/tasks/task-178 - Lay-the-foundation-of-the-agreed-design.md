---
id: TASK-178
title: Lay the foundation of the agreed design
status: To Do
assignee: []
created_date: '2026-10-30 18:35'
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
- [ ] #1 The section "Frontend: function first" is removed from `.claude/rules/until-v1.md`
- [ ] #2 `.claude/rules/ui-components.md` states how styling is done: colours and other design values only through the tokens of `docs/design.md`, no raw colour values in components or pages, component styles in the component's own `<style>` block
- [ ] #3 One global stylesheet defines every token of `docs/design.md` with `light-dark()`, follows `prefers-color-scheme` by default and honours `data-theme="light"` / `data-theme="dark"` on `<html>`
- [ ] #4 The global stylesheet sets the base of `docs/design.md`: body typography, headings, the focus ring, transitions that drop to 0 under `prefers-reduced-motion`, and 44px controls under `pointer: coarse`
- [ ] #5 IBM Plex Sans and IBM Plex Mono are self-hosted with the weights `docs/design.md` names; no page loads anything from a font CDN
- [ ] #6 Storybook loads the same global stylesheet and can show every story in light and in dark
- [ ] #7 `make lint`, `make test`, `make build` and `make e2e` pass
<!-- AC:END -->

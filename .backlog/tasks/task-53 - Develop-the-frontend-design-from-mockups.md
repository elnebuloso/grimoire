---
id: TASK-53
title: Develop the frontend design from mockups
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-29T06:55:00Z'
updated_date: '2026-10-30 17:41'
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
- [ ] #1 Each round offers the developer a proposed number of independent mockups, each in a clearly different direction or, after the first round, a different variation of the chosen one
- [ ] #2 Every mockup opens in the browser and is fully usable: every page of the current UI (start page, setup, login, forgot password, password reset, account, error page, and in the management area the overview, source detail with page preview, new source, try a query, queries without results, API keys, settings and dead links) with its states, including empty, error and validation states
- [ ] #3 The mockups mirror the current behaviour of the UI: the same pages, fields, steps and messages, without inventing features
- [ ] #4 After each round the developer picks a direction, and the choice and feedback are recorded in this task's notes before the next round starts
- [ ] #5 The rounds end when the developer declares the design agreed
- [ ] #6 The agreed design is usable as a template for implementation: its design decisions (colours, typography, spacing, components, light and dark variant) are kept in `docs/design.md`; the mockups themselves stay local in `docs/mockups/`, which git ignores
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

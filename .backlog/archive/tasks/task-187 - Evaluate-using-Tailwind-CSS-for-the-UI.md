---
id: TASK-187
title: Evaluate using Tailwind CSS for the UI
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 21:41'
updated_date: '2026-10-30 22:26'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: spike
ordinal: 249000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Check whether grimoire should style its UI with Tailwind CSS instead of, or alongside, the current setup.

Today: no Tailwind. The design (`docs/DESIGN.md`) lives as custom properties and a base of native elements in `app/src/app.css`; components and pages style themselves in scoped `<style>` blocks with `var(--…)` tokens (rules in `.claude/rules/ui-components.md`). Light and dark come from `light-dark()` tokens and `data-theme`.

Questions to answer:
- What would change for a maintainer: how tokens, both schemes, `prefers-reduced-motion` and `pointer: coarse` sizes map to Tailwind 4 (`@theme`, variants), and what happens to the scoped styles and the page primitives (`.sheet`, `.notice`, `.table-scroll`, `.muted`).
- Cost: setup only through the Svelte CLI, never by hand (`.claude/rules/svelte-kit.md`): `npx sv@<version> add tailwindcss="plugins:none" --install npm` from `app/` after `nvm use 24.22.1`, with `sv` pinned to a release at least two weeks old (1.1.1 at the time of writing; `npm view sv time`), the add-on's only option `plugins` (typography, forms) set explicitly, and the versions it adds pinned exactly in `app/package.json`, build size and build time measured against today, Storybook, migration effort of the existing components and pages.
- What it would unlock, e.g. icon tooling such as `@iconify/tailwind4` (TASK-186 chose `@lucide/svelte` because Tailwind is absent).
- Recommendation: adopt fully, adopt only for new code, or stay with plain CSS, with the reasons.

No code change in this task; the outcome is a recommendation for the user to decide on, and if adopted, follow-up tasks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Today's styling setup and the Tailwind 4 alternative are compared on tokens, both schemes, scoped component styles, Storybook and maintainability
- [x] #2 Build size and build time are measured on a throwaway branch, not estimated
- [x] #3 The migration effort for the existing components and pages is estimated
- [x] #4 A recommendation (adopt, adopt for new code only, or stay) with reasons is recorded in the task and presented to the user
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured on a throwaway worktree (branch spike/tailwind, deleted afterwards), Node 24.22.1, three builds each:
- Setup: `npx sv@1.1.1 add tailwindcss="plugins:none" --install npm` adds tailwindcss and @tailwindcss/vite with caret ranges (would need pinning), adds prettier-plugin-tailwindcss to prettier.config.js, writes app/.vscode/* and src/routes/layout.css (`@import 'tailwindcss'`), imports it in +layout.svelte and reformats markup there.
- Build time: 9.8–11.0 s before, 10.5–11.6 s after (about +0.6 s, near the noise).
- Client CSS with Tailwind set up but no utility used: 18.9 KB -> 26.3 KB raw, 4.3 KB -> 6.3 KB gzip (preflight and theme variables). Client JS unchanged (63.8 KB gzip).
- Migration scope today: app.css 474 lines (tokens, base of native elements, page primitives), 23 scoped <style> blocks with 673 lines, 17 components with stories.
- Tokens: light-dark() custom properties would move into @theme; both schemes, prefers-reduced-motion and pointer: coarse map to variants, but the rules in .claude/rules/ui-components.md (scoped styles, app.css holds only shared base) and DESIGN.md would be rewritten around utilities.

Recommendation: stay with plain CSS. The design already lives in one token set and scoped component styles that the rules and DESIGN.md are written around; Tailwind would add a second idiom (or a migration of ~1150 lines across 24 files) and more CSS, for no feature the product lacks. Icons, the one concrete gain named, are solved with @lucide/svelte (TASK-186). Reopen if the UI grows enough that writing scoped CSS becomes the bottleneck.

Decision by the user: stay with plain CSS and tokens for now.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Spike done, no code changed. Tailwind 4 via sv 1.1.1 costs about +0.6 s build and +2 KB gzip CSS before a single utility, plus a migration of ~1150 lines of CSS and the styling rules. Recommendation: stay with plain CSS and tokens; decision is the user's.
<!-- SECTION:FINAL_SUMMARY:END -->

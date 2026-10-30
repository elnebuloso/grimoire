---
id: TASK-180
title: Style the shared components
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 18:35'
updated_date: '2026-10-30 18:59'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-178
references:
  - app/src/lib/components/
  - .claude/rules/ui-components.md
documentation:
  - docs/design.md
priority: medium
type: feature
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The building blocks in `app/src/lib/components/` (fields, form error, confirm and copy buttons, description list, source stats table, page list, query form, slug change form) render with browser defaults. They carry most of the UI, and their stories are the catalog and the tests of the UI, so they get the design first and in one place: each page that uses them is then styled for free.

`docs/design.md` describes each of them under Components: inputs as wells that rise on focus, raised buttons with a primary and a danger variant, the facts ledger with its numbers variant, tables with hairlines and tabular numbers, notices with a leading edge, the one-time key and copy result, code in wells.

Design source: `docs/design.md` (binding). Visual reference: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`; the bar at the bottom right switches the states of each page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every component in `app/src/lib/components/` matches `docs/design.md` in light and dark
- [x] #2 Every state a component can be in has a story, including states the stories lack today (e.g. the copy result of `CopyButton`), and each story's `play` function still checks what the state shows
- [x] #3 No component contains a raw colour value; colours come from the tokens
- [x] #4 Every text of every story meets WCAG AA contrast in light and dark
- [x] #5 `make test` passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Global base: `form` as a 16px grid, a lone button keeps its width.
2. Fields: `TextField`, `TextAreaField`, `NameField` as a label above the well (6px apart), the slug preview in mono; `ChoiceField` as an 18px box with its label to the right, 44px rows on touch. New prop `mono` on `TextField` and `ChoiceField` for machine strings (slug, branch, path, cron, source slugs), with a story each.
3. `FormError` as the alert notice; `ConfirmForm` button as the danger variant; `CopyButton` result as coloured text (`--ok` / `--err`).
4. `DescriptionList` as the facts ledger with a `numbers` variant (right-aligned tabular, 500) plus a story.
5. `SourceStatsTable`: numbers right-aligned, source cell stacked (name 500, slug mono `--ink-2`, description, docs link), state words coloured ("yes" `--err`, "no"/"not synced" `--ink-2`), times without wrap.
6. `PageList` as hairline rows with mono file links; `QueryForm` with the source checks in a wrapping row, primary submit, the answer below a hairline in a well; `SlugChangeForm` with mono fields and the notices.
7. Verify every story in light and dark with axe (contrast) and the play functions: `make test`; look at the stories in Storybook.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Field components now render a grid label (text above the well, 6px) instead of `<p><label>`; the label still wraps the control, so `getByLabel` in tests keeps working. New props: `mono` on `TextField` and `ChoiceField`, `numbers` on `DescriptionList`; each with a new story (Machine string, Numbers). The copy result states (Copied, Clipboard refused) already had stories; they now show `--ok` / `--err`.
Global `app.css` gained the `form` base (16px grid, a direct button keeps its width).
`PageList`: the counts line after the file link in `--ink-2` (one message, so title and counts share it).
Check: axe-core (wcag2a/aa) over all 41 stories with `globals=theme:light` and `theme:dark`: 0 violations; screenshots of QueryForm answered, SourceStatsTable with sync error and SlugChangeForm rejected compared against e/6. No hex/rgb/hsl value in any component.
make lint, make test (667) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Styled every shared component per `docs/design.md`: fields as labelled wells (mono for machine strings), checkboxes with the accent, alert notice for form errors, danger confirm button, coloured copy result, facts ledger with a numbers variant, the source table with right-aligned figures, stacked source cell and coloured state words, page list rows, query form with primary submit and the answer in a well, slug form with mono fields. New stories cover the new variants. Verified: all stories pass their play functions and axe contrast in light and dark; lint and test green.
<!-- SECTION:FINAL_SUMMARY:END -->

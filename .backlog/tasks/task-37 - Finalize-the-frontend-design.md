---
id: TASK-37
title: Finalize the frontend design
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-30 19:40'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-178
  - TASK-179
  - TASK-180
  - TASK-181
  - TASK-182
  - TASK-50
  - TASK-58
documentation:
  - docs/design.md
priority: low
type: feature
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The visual design is chosen: mockup e/6, recorded in `docs/design.md`. TASK-178 to TASK-182 bring it into the product, TASK-50 adds the switch between light and dark, and TASK-58 makes the accessibility check of the stories fail the build. This task is the final acceptance of all of that by the user, and it removes the mockups once they have served their purpose: from then on `docs/design.md` is the only record of the design.

Visual reference until then: mockup e/6, local and git-ignored: `cd docs/mockups && python3 -m http.server 8765`, then `http://127.0.0.1:8765/e/6/`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The admin area has a visual design the user agreed on
- [ ] #2 Every admin flow covered by `make e2e` still works with the design
- [ ] #3 Every page and state matches `docs/design.md` in light and dark, compared against the mockup e/6
- [ ] #4 `docs/mockups/` is deleted once the design is accepted, together with its entry in `.gitignore`
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Accepted only by the user explicitly confirming the design; not marked done before that
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bring the design into the product: TASK-178 to TASK-182, TASK-50, TASK-58 (done).
2. Hand the result to the user for review in light and dark, against mockup e/6.
3. After the user's explicit acceptance: delete `docs/mockups/` and its line in `.gitignore`, check the criteria, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ready for acceptance. TASK-178 to TASK-182, TASK-50 and TASK-58 are done. `make e2e` (20 tests, every admin flow) passes with the design (AC #2 evidence). Every page and state was compared against e/6 in light and dark at 390 and 1366 px with screenshots, axe (wcag2a/aa) and an overflow check during those tasks (AC #3 evidence, listed in each task's notes).
Known deviations from the mockup, deliberate: links after a status ("Log in", "Request a new link", "To the start page") and "New source" are plain links, not link-styled buttons, since `docs/design.md` defines no such element; the page-list line after the file name is one message, shown entirely in `--ink-2`.
Waiting for the user's explicit acceptance (DoD #1); AC #1 and #4 follow from it.
<!-- SECTION:NOTES:END -->

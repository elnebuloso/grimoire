---
id: TASK-37
title: Finalize the frontend design
status: To Do
assignee: []
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-30 18:36'
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

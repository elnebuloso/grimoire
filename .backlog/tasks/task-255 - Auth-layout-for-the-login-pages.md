---
id: TASK-255
title: Auth layout for the login pages
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 23:37'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-252
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 317000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Login, password reset, invitation, setup and the sign-on callback are pass-through pages with a single task; they do not belong to any area and need no area switch (chapter 5.2 and 8 of the concept).

Measure M8 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/login`, `/login/forgot`, `/login/reset/[token]`, `/invite/[token]`, `/setup` and `/auth/oidc/[key]/callback` use one `AuthLayout`
- [x] #2 The setup page presents "start new" and "import an export" as two clearly separated ways with one sentence each on when to choose it
- [x] #3 `AuthLayout` has stories with axe
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R8 (2026-11-06): the six pages render in an `AuthLayout` without the header bar: a narrow centered column with the brand (logo, instance title, link to `/`) above one card holding title, lead, form and way out; the footer of M5 stays below. Setup: two separated cards side by side in a column twice as wide, "Start new" and "Move an instance here", one sentence each on when to choose it; the setup token stays in both forms. Callback unchanged inside the layout. Login account sentence and invalid links stay for TASK-264, the landing after an invitation for TASK-254. `csr = false` stays.
2. `AuthLayout` component with stories (card, wide; axe); `AppShell` renders it for auth pages.
3. Pages drop their own `.sheet` wrapper; setup gets the two ways and new texts in en and de.
4. Check e2e for setup/login texts; full suites.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The pages of getting in render through `AppShell` with `auth="card"` (login, forgot, reset, invite, callback) or `auth="wide"` (setup); `AuthLayout` puts the brand above one card, or above the page's own cards when wide. The pages dropped their own `.sheet`. Setup texts: `setup_intro` now names the two ways, new `setup_new_title`/`setup_new_lead`, `setup_import_title` became "Move an instance here" with a when-to-choose lead; `docs/handbook/moving.md` follows. Checked in the agent environment (login light and dark, forgot, invalid reset and invitation, setup with the admin role removed, then `make agent-reset`).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Login, forgot, reset, invitation, setup and the sign-on callback now use one `AuthLayout`: no header bar, the brand centred above a single card in a narrow column, the M5 footer below. The setup shows "Start new" and "Move an instance here" side by side, each with one sentence on when to choose it. Verified: `make lint`, `make test` (102 files, 1025 tests), `make e2e` (28 passed), `make handbook`, and by hand in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->

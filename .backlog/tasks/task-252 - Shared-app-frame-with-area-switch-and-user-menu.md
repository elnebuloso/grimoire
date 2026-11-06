---
id: TASK-252
title: Shared app frame with area switch and user menu
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-05 23:28'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: feature
ordinal: 314000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Start page, account and management are loosely coupled: the management navigation links to account pages that do not show it, users without a role reach their pages only through a header button and their email address, and the header takes four lines on a phone (findings U6, U7, U26). Chapter 5.3 of the concept defines one frame for every page except the login pages.

Measure M5 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every page except the login pages shows the brand, an area switch (Start, Account when logged in, Management for admins) with the current area marked, and a user menu (email, log out) or "Log in"
- [x] #2 Language and theme are in the user menu, for anonymous visitors in the footer
- [x] #3 Users without a role see no management entry
- [x] #4 `AppShell`, `AreaSwitch` and `UserMenu` have stories per role, with axe
- [x] #5 `theme.e2e.ts` and `language.e2e.ts` pass with the moved switches
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R11 (2026-11-06): frame on every page but the auth pages (login, forgot, reset, invite, setup, OIDC callback), which show the brand and a footer with language and theme; brand = logo + instance title to `/`; area switch Start / Account (logged in) / Management (whoever may open `/manage`), current area from the path with `aria-current`; targets `/`, `/account/api-keys`, `/manage`; user menu = native popover with email heading, language, theme, "Log out"; anonymous visitors get language and theme in the footer; the full loads (language, log out, log in) stay; "Logged in as" and the header button go, the account links in the management nav stay for TASK-253. No phone layout (desktop rule in ui-components.md).
2. New components `AppShell`, `AreaSwitch`, `UserMenu`, `Preferences` (language and theme switches, used in the menu and the footer) with stories per role and axe.
3. Root layout renders `AppShell`; messages in en and de.
4. Update `manage.e2e.ts` (log out through the menu, area links), check `theme.e2e.ts`, `language.e2e.ts`; handbook paths naming the header.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner decision during the work (option a of three): the user menu also links to `/account` as "Login and password", since the email no longer links there and the Account area opens `/account/api-keys`; without it a user without a role had no way to the password and provider page until TASK-254. Kept for good. The menu is a native popover placed by script on opening; a click before hydration would open it at the top left. The auth pages show only the brand and the footer with language and theme. Login page e2e checks now assert "no user menu in the header" instead of the old "Log in" link. Phone styles of the old header are gone (desktop rule). Checked in the agent environment (anonymous, user without a role, admin, login page; light and dark; Escape returns focus to the button).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every page now has one frame (`AppShell`): brand with the instance title, an area switch (`AreaSwitch`: Start, Account, Management for whoever may open `/manage`, current area from the path via `areaOf` in `app/src/lib/areas.ts`) and a user menu (`UserMenu`: address, language, theme, "Login and password", "Log out"). Anonymous visitors and the auth pages get language and theme in the footer (`Preferences`). "Logged in as" and the header button are gone; the account links in the management nav stay for TASK-253. Handbook paths in `users.md`, `admin.md`, `sso.md` follow. Verified: `make lint`, `make test` (101 files, 1023 tests), `make e2e` (28 passed), `make handbook`, and by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

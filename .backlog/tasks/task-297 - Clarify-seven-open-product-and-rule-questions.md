---
id: TASK-297
title: 'Clarify: seven open product and rule questions'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 16:00'
updated_date: '2026-11-06 19:36'
labels: []
dependencies: []
priority: low
type: spike
ordinal: 359000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Questions where the code and the rules disagree or where behaviour may be deliberate. Each needs the owner decision before anyone builds:
1. Font sizes: `.claude/rules/ui-components.md` lists fonts among token-only values, but `app/src/app.css` defines families and no sizes; components use eight literal sizes (12 to 18 px) in about 40 declarations. Do sizes count (then add a type scale), or does the rule mean families only?
2. An admin who removes their own identity link on the users page is logged out: `removeIdentity` (`oidc/identities.ts`) ends every session of the user, the current one included; the account page variant keeps it. Keep, warn, or keep the session?
3. `app/src/lib/server/admin/` holds login, sessions, password resets and access for every user (`auth.ts`, `access.ts`, `password-reset.ts`). Move them out of `admin/` (one pass of imports, `scripts/` included)?
4. Starting a provider login ends the current session first (`app/src/routes/auth/oidc/[key]/+server.ts`, deliberate per its comment). A logged-in user following an invitation link who cancels at the provider is logged out with nothing gained. Keep?
5. The visually-hidden style is written four times (`.hidden` in `manage/+layout.svelte`, `.spoken` in `DeadLinkList.svelte`, in `SegmentedSwitch.svelte`, the skip link in `AppShell.svelte`). Add an `.sr-only` primitive to the list `app.css` may hold?
6. Handbook links (`+page.svelte`, `AppShell.svelte`, asserted in `manage.e2e.ts`) hard-code `https://elnebuloso.github.io/grimoire/…`, the latest release, whatever version the instance runs. Link a versioned handbook?
7. Touch sizes and phone styles remain in `app.css` (44 px minimum under `pointer: coarse`, restyles below 40rem) and in `SegmentedSwitch.svelte` and `Toast.svelte`, while the rule says there are none; its clause that phone styles go when a page is rebuilt does not reach `app.css` and components. Remove them, or say in the rule that they stay?
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each of the seven questions has a recorded decision in this task
- [x] #2 Every decision that needs work has its own task, or a rule change is made
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions of the owner (2026-11-06):
1. Font sizes count as token-only values: type scale in app.css → TASK-298.
2. An admin removing their own identity link keeps the current session → done in TASK-280 (removeIdentity keeps the current session).
3. Move auth.ts, access.ts, password-reset.ts out of admin/ to server/auth/ → TASK-299.
4. Starting a provider login ends the session only once the login succeeds → TASK-300.
5. Add a .sr-only primitive to app.css and the rule → TASK-301.
6. Handbook links stay on the latest handbook; no versioned handbook. No work.
7. Remove touch sizes and phone styles from app.css and components → TASK-302.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All seven questions are decided by the owner and recorded. Decision 2 was built in TASK-280, decision 6 needs no work, the other five became TASK-298 to TASK-302.
<!-- SECTION:FINAL_SUMMARY:END -->

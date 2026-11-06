---
id: TASK-297
title: 'Clarify: seven open product and rule questions'
status: To Do
assignee: []
created_date: '2026-11-06 16:00'
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
- [ ] #1 Each of the seven questions has a recorded decision in this task
- [ ] #2 Every decision that needs work has its own task, or a rule change is made
<!-- AC:END -->

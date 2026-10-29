---
id: TASK-54
title: Login action on every page while logged out
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:57:00Z'
updated_date: '2026-10-29 18:34'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/routes/+layout.svelte
  - app/src/routes/+page.svelte
priority: medium
type: enhancement
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nothing in the UI leads to `/admin/login`: the public start page has no link to it, so the admin has to know the URL and type it. Logging in should be one click from wherever the admin is.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every page shown to a visitor who is not logged in offers a login action that leads to `/admin/login`
- [x] #2 Without an admin account yet, the action still leads on to setup, as `/admin/login` does today
- [x] #3 The action works without JavaScript
- [x] #4 An e2e test checks the login action on the start page while logged out and its replacement while logged in
- [x] #5 While logged in, the same place shows which admin is logged in, linked to the admin area, and offers logging out; logging out is no longer on the admin start page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Session cookie path / instead of /admin (auth.ts), so public pages see whether someone is logged in; httpOnly and SameSite=strict stay.
2. Root +layout.server.ts loads the logged-in admin's username (sessionValid + adminUsername).
3. Root +layout.svelte header: logged out a link Log in to /admin/login (which leads on to setup without an account); logged in 'Logged in as <username>' linking to /admin plus the Log out form. Markup only.
4. Log out moves from the admin start page into the header.
5. Handbook admin.md, e2e tests for both states.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user: when logged in, the place shows the logged-in admin, linked to /admin, and Log out moves there. The session cookie path is now / (it was /admin, so public pages could not see the session).

Found while testing: with JavaScript, a client-side navigation to /admin/login never reached the server hook, because that page loads no data, so a first visit stayed on the login form instead of going on to setup. The Log in link therefore uses data-sveltekit-reload.

Verified: make test (303), make lint, and make e2e (11/11, two new tests: login action leads to setup before any account; login action, logged-in admin with link to /admin, and Log out on the start page). Without JavaScript via curl in the agent environment: the header shows the Log in link while logged out; login sets the cookie with Path=/; the header then shows 'Logged in as agent' with the Log out form; after logout it shows Log in again.

Not verified: a browser holding an old session cookie with Path=/admin could keep sending it to /admin pages next to the new one. The old cookie is a session cookie and dies when the browser closes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every page has a header. While logged out it shows 'Log in', which leads to /admin/login, and on to setup while there is no admin account; it uses a full request, because a client-side navigation skipped the server hook. Once logged in, the header shows the admin's username linked to /admin, plus the Log out form, which moved there from the admin start page. Everything works without JavaScript. The session cookie path changed from /admin to / so public pages can see the session; httpOnly and SameSite=strict are unchanged. The handbook section 'Logging in' describes it. Covered by two new e2e tests and checked by hand without JavaScript.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-117
title: 'Handbook: grimoire needs `https`, plain `http` works only on `localhost`'
status: To Do
assignee: []
created_date: '2026-10-30 08:57'
labels:
  - ops
milestone: m-0
dependencies: []
priority: low
type: docs
ordinal: 179000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`docs/handbook/docker.md` opens by saying grimoire expects a reverse proxy "that terminates TLS or at least passes on the original protocol", which reads as if plain `http` behind a proxy were supported under any host name.

The session cookie (`sessionCookieOptions` in `app/src/lib/server/admin/auth.ts`) does not set `secure`, so SvelteKit's default applies: `secure` everywhere except on `http://localhost` (see `app/node_modules/@sveltejs/kit/src/runtime/server/cookie.js`). Behind a proxy serving plain `http` under another host name (for example `http://grimoire.lan:8080`), forms pass the origin check, but the browser should drop the `Secure` session cookie on an `http` page: login appears to succeed and the session is gone. Derived from the source, not yet tested in a browser.

Decision taken for this task: document the limit rather than support plain `http`; supporting it would mean setting `secure` from the derived protocol and weakening the cookie for every install.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The limit is confirmed or refuted by trying a login over plain `http` under a host name other than `localhost`, and the result is noted in the task
- [ ] #2 `docs/handbook/docker.md` and `docs/handbook/admin.md#logging-in` state that grimoire needs `https`, with plain `http` only on `localhost`, and why
- [ ] #3 `make handbook` builds without errors
<!-- AC:END -->

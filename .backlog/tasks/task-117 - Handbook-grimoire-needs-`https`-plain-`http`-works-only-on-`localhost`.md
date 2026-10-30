---
id: TASK-117
title: 'Handbook: grimoire needs `https`, plain `http` works only on `localhost`'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:57'
updated_date: '2026-10-30 09:08'
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
- [x] #1 The limit is confirmed or refuted by trying a login over plain `http` under a host name other than `localhost`, and the result is noted in the task
- [x] #2 `docs/handbook/docker.md` and `docs/handbook/admin.md#logging-in` state that grimoire needs `https`, with plain `http` only on `localhost`, and why
- [x] #3 `make handbook` builds without errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Try a login over plain `http` in Chromium against the production build, on `localhost` and on another host name.
2. Depending on the result, state the limit in `docs/handbook/docker.md` (intro) and `docs/handbook/admin.md#logging-in`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed in Chromium (Playwright from `app/node_modules`, `--host-resolver-rules=MAP grimoire.lan 127.0.0.1`) against `node build` on port 4180 with `PROTOCOL_HEADER=x-forwarded-proto` and the header `x-forwarded-proto: http` standing in for the proxy, database from `scripts/agent-seed.ts`:
- `http://localhost:4180`: `Set-Cookie: grimoire_session=...; Path=/; HttpOnly; SameSite=Strict`, login lands on `/manage`, `/account` opens.
- `http://grimoire.lan:4180`: `Set-Cookie: ...; HttpOnly; Secure; SameSite=Strict`, the browser stores no cookie, the login ends on `/login` again and `/account` redirects to `/login`.
SvelteKit sets `secure` unless `url.hostname === 'localhost'` over `http:` (`@sveltejs/kit/src/runtime/server/cookie.js`, 3.1.0). `make handbook` and `make lint` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook no longer promises plain `http` behind a proxy: `docs/handbook/docker.md` and `docs/handbook/admin.md#logging-in` say grimoire needs `https` outside `localhost`, because the session cookie is `Secure` there and a browser drops it on an `http` page. Confirmed in Chromium against the production build: on `http://grimoire.lan` the login is accepted and the next page asks for it again; on `http://localhost` it works. No code change; supporting plain `http` would need `secure` taken from the derived protocol and remains a separate decision.
<!-- SECTION:FINAL_SUMMARY:END -->

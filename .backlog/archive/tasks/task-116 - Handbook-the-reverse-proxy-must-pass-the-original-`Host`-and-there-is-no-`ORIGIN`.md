---
id: TASK-116
title: >-
  Handbook: the reverse proxy must pass the original `Host`, and there is no
  `ORIGIN`
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:57'
updated_date: '2026-10-30 09:06'
labels:
  - ops
milestone: m-0
dependencies:
  - TASK-115
priority: medium
type: docs
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SvelteKit rejects form POSTs whose `Origin` header differs from the app's own origin (`Cross-site POST form submissions are forbidden`). adapter-node 6 has no `ORIGIN` variable; it derives the origin per request from `PROTOCOL_HEADER` (default `https`), `HOST_HEADER` (default: the `Host` header) and `PORT_HEADER`. The only static alternative, `paths.origin` in the SvelteKit config, is fixed at build time and so unusable for the one public image `elnebuloso/grimoire`.

The handbook explains `PROTOCOL_HEADER` and `ADDRESS_HEADER` (`docs/handbook/admin.md#logging-in`, environment table in `docs/handbook/docker.md`) but never says that the host part comes from `Host`, and never mentions `HOST_HEADER`. The Compose example works only because Caddy passes `Host` on unchanged. A proxy that rewrites `Host` to the upstream name (plain nginx does by default with `proxy_set_header Host $proxy_host`; general knowledge, not tested here) makes grimoire derive e.g. `https://grimoire:3000`: every form (setup, login, management, password reset) fails with the cross-site error, and without `BASE_URL` the start page's `claude mcp add` URL and `llms.txt` links point to the internal host. The 403 message points to CSRF, not to the proxy.

Operators who know other SvelteKit apps try `ORIGIN=https://...` first. `app/src/env.ts` does not declare it and adapter-node 6 does not read it, so it is silently ignored. `BASE_URL` does not take part in the CSRF check either; it only sets the address used in absolute links (see the task making `BASE_URL` drive every absolute link).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `docs/handbook/admin.md#logging-in` says the origin is derived per request from protocol and `Host`, that the proxy must pass the original `Host` or `HOST_HEADER` must name the header carrying it (for example `x-forwarded-host`), that there is no `ORIGIN` variable, and that `BASE_URL` does not affect the check
- [x] #2 The environment table in `docs/handbook/docker.md` lists `HOST_HEADER`
- [x] #3 `make handbook` builds without errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm in `app/node_modules/@sveltejs/adapter-node/src/handler.js` (6.0.0) which headers form the origin.
2. Add a paragraph to `docs/handbook/admin.md#logging-in`: origin from protocol and `Host`, proxy must keep `Host` or `HOST_HEADER` names the header, no `ORIGIN`, `BASE_URL` not part of the check.
3. Add a `HOST_HEADER` row to the environment table in `docs/handbook/docker.md`.
4. Verify the claims against the production build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
adapter-node 6.0.0 reads `PROTOCOL_HEADER`, `HOST_HEADER` (falls back to `Host`), `PORT_HEADER` and `ADDRESS_HEADER`; no `ORIGIN`.

Verified with `make build` and `node build` on port 4180 (`PROTOCOL_HEADER=x-forwarded-proto`), POST `/login` with `Origin: http://localhost:4180`:
- `Host: localhost:4180` -> normal action result (303 to `/setup`)
- `Host: grimoire:3000` -> `Cross-site POST form submissions are forbidden`
- same rewritten `Host` with `HOST_HEADER=x-forwarded-host` and `X-Forwarded-Host: localhost:4180` -> normal action result
- same rewritten `Host` with `ORIGIN=http://localhost:4180` -> still forbidden, so `ORIGIN` is ignored.
The nginx default (`proxy_set_header Host $proxy_host`) is from the nginx documentation, not tested here. `make handbook` and `make lint` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook now says where grimoire's origin comes from: `docs/handbook/admin.md#logging-in` explains that the host part is the `Host` header, that the proxy must pass it on or `HOST_HEADER` must name the header carrying it, that there is no `ORIGIN` variable and that `BASE_URL` takes no part in the cross-site check; `docs/handbook/docker.md` lists `HOST_HEADER`. Each claim was checked against the production build: rewritten `Host` -> 403, `HOST_HEADER` fixes it, `ORIGIN` changes nothing.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-115
title: Use `BASE_URL` for every absolute link when it is set
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 08:57'
updated_date: '2026-10-30 09:04'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/mail/smtp.ts
  - app/src/routes/+page.server.ts
  - 'app/src/routes/p/[project]/llms.txt/+server.ts'
priority: medium
type: enhancement
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire has two answers to "where is this instance reachable?". Mail links (password reset) are built only from `BASE_URL` (`Mailer.link()` in `app/src/lib/server/mail/smtp.ts`), because the request's `Host` header is chosen by the sender and a reset link to a forged host would hand the token to whoever runs it. The start page (`app/src/routes/+page.server.ts`, the `claude mcp add ... {origin}/mcp` command in `app/src/routes/+page.svelte`) and `llms.txt` (`app/src/routes/p/[project]/llms.txt/+server.ts`) instead use `url.origin`, which adapter-node 6 derives per request from `PROTOCOL_HEADER` (default `https`) and the `Host` header (or `HOST_HEADER`).

Once an operator sets `BASE_URL` they have told grimoire its canonical address, yet two of three places that build outward links ignore it, and nothing notices when `BASE_URL` disagrees with the address browsers actually use. A wrong scheme or host in `BASE_URL` then makes every reset link point to an address where the reset form fails SvelteKit's CSRF origin check, and the first sign is a user complaint. A future feature needing an absolute URL also has two models to choose from.

Out of scope, deliberately: making `BASE_URL` required without SMTP. It would add no protection: SvelteKit's CSRF check compares the browser's `Origin` with the per-request origin (or the build-time `paths.origin`), never with an env variable, and the per-request origin is safe for that check because a victim's browser sends the real `Host` and the attacker's `Origin`. `BASE_URL` stays optional and required only with `SMTP_HOST`. There is no `ORIGIN` variable in adapter-node 6, and a build-time `paths.origin` cannot be used because one public image serves every installation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With `BASE_URL` set, the start page and `llms.txt` use it as origin for their absolute links, whatever `Host` the request carries
- [x] #2 Without `BASE_URL`, both keep using the origin derived from the request
- [x] #3 The start page and `llms.txt` choose between `BASE_URL` and the request origin through one function; mail links keep using `BASE_URL` only and never fall back to the request
- [x] #4 When a request's derived origin differs from a set `BASE_URL`, a `warn` log entry names both, once per process, not per request
- [x] #5 Unit tests cover set, unset and differing origin; the `BASE_URL` row in the environment table of `docs/handbook/docker.md` says it also drives the start page and `llms.txt`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/public-origin.ts`: `createPublicOrigin(baseUrl)` returns a function `(url) => origin` that returns `BASE_URL` when set, else `url.origin`, and warns once per instance on a mismatch; `publicOrigin` is the instance for `BASE_URL`.
2. Start page load and `llms.txt` route call `publicOrigin(url)` instead of `url.origin`.
3. Mail links stay on `BASE_URL` alone (`Mailer.link()`): a mailer exists only with `BASE_URL` set, and must never fall back to the request.
4. Unit tests for the function; `BASE_URL` in the `$app/env/private` mock of `agent-api.spec.ts`.
5. Update `BASE_URL` in the `docker.md` environment table, `env.ts` description and `.env.example`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Mail links were not routed through `publicOrigin`: they have no request, and a mailer only exists with `BASE_URL` set, so the function would always return `BASE_URL` there; the AC was reworded accordingly. `docs/handbook/database.md` lists no SMTP or `BASE_URL` variables, so only `docker.md` (plus the `env.ts` description and `app/.env.example`) were updated.

Verified in the agent environment: without `BASE_URL`, `http://localhost:5174/` and `http://127.0.0.1:5174/` each show their own origin in `claude mcp add` and `llms.txt`. With `BASE_URL=http://localhost:5174`, both hosts show `http://localhost:5174`, and three requests via `127.0.0.1` produced exactly one log line `A request arrived at http://127.0.0.1:5174, but BASE_URL is http://localhost:5174; links point to BASE_URL`. `make test` (593 tests), `make lint`, `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`BASE_URL`, when set, is now the origin of every absolute link: besides mail links also the `claude mcp add` command on the start page and the page links in `llms.txt`, via `publicOrigin(url)` in `app/src/lib/server/public-origin.ts`. Without it, both use the request origin as before. A request arriving at a different origin is logged once as a warning, so a misconfigured `BASE_URL` or proxy shows up before the first reset mail does. `BASE_URL` stays optional (required only with `SMTP_HOST`). Covered by unit tests and checked by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

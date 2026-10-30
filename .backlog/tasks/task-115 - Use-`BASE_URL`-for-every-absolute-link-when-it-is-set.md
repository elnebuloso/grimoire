---
id: TASK-115
title: Use `BASE_URL` for every absolute link when it is set
status: To Do
assignee: []
created_date: '2026-10-30 08:57'
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
- [ ] #1 With `BASE_URL` set, the start page and `llms.txt` use it as origin for their absolute links, whatever `Host` the request carries
- [ ] #2 Without `BASE_URL`, both keep using the origin derived from the request
- [ ] #3 The choice between `BASE_URL` and the request origin is made in one place that mail links, the start page and `llms.txt` all use
- [ ] #4 When a request's derived origin differs from a set `BASE_URL`, a `warn` log entry names both, once per process, not per request
- [ ] #5 Unit tests cover set, unset and differing origin; the handbook rows for `BASE_URL` in `docs/handbook/docker.md` and `docs/handbook/database.md` say it also drives the start page and `llms.txt`
<!-- AC:END -->

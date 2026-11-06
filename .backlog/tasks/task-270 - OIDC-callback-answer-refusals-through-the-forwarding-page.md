---
id: TASK-270
title: 'OIDC callback: answer refusals through the forwarding page'
status: To Do
assignee: []
created_date: '2026-11-06 15:55'
labels:
  - admin
dependencies: []
priority: high
type: bug
ordinal: 332000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The OIDC callback (`app/src/routes/auth/oidc/[key]/callback/+page.server.ts`) forwards a successful login through a page with `<meta http-equiv="refresh">` because the session cookie is `SameSite=Strict` and is "not sent on a request that comes from the provider's site" (its own comment). Every refusal in the same load is a `redirect(303, …)` through `refuse()`, which continues the same cross-site navigation, so by the same reasoning the strict cookie does not arrive at the target either.

For linking a provider from the account page (user is logged in) this goes wrong:
- Refusals before the decision ignore `flow.link` and always go to `/login`: cancelled at the provider or other provider error (`oidc-failed`), provider down, flow older than 10 minutes, too many failures. The logged-in user sees the login form and appears logged out.
- A required-claims refusal goes to `/account?problem=oidc-claims`; without the cookie, `hooks.server.ts` turns it into `/login?next=…` and the reason shows only after a second login.

Cancelling at the provider is the most ordinary way a link attempt ends. Not reproduced in a browser; reasoned from the code, the callback comment and the SameSite rule.

Tests cannot see it: `make e2e` runs app and OIDC mock both on `localhost` (`app/playwright.config.ts`), so every request is same-site. In `callback.spec.ts` the helper `answer()` returns the forwarding page `next` and a thrown redirect `location` as the same string, and no test opens a flow with `link` set.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every refusal after the flow is open is answered through the forwarding page (`{ next: "<page>?problem=…" }`), not a 303 redirect
- [ ] #2 The target page is chosen from `flow.link` for every refusal, so a refused link returns to the account page
- [ ] #3 `callback.spec.ts` distinguishes a forwarded answer from a redirect and covers a cancelled flow with `link` set
- [ ] #4 Decide whether an e2e with the issuer on another site (e.g. `127.0.0.1` against `localhost`) is added; record the decision in the task
<!-- AC:END -->

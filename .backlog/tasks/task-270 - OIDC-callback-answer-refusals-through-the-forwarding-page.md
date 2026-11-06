---
id: TASK-270
title: 'OIDC callback: answer refusals through the forwarding page'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:55'
updated_date: '2026-11-06 16:31'
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
- [x] #1 Every refusal after the flow is open is answered through the forwarding page (`{ next: "<page>?problem=…" }`), not a 303 redirect
- [x] #2 The target page is chosen from `flow.link` for every refusal, so a refused link returns to the account page
- [x] #3 `callback.spec.ts` distinguishes a forwarded answer from a redirect and covers a cancelled flow with `link` set
- [x] #4 Decide whether an e2e with the issuer on another site (e.g. `127.0.0.1` against `localhost`) is added; record the decision in the task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs first: callback.spec answer() marks redirects (redirect:<target>), new cases for a link flow cancelled, provider down, expired, blocked
2. Callback returns { next: page?problem=… } for every refusal; page from flow.link, also for an expired flow (openFlow returns it)
3. e2e: GitLab issuer of make e2e moved to 127.0.0.1 (another site); manage.e2e cancels a link at the provider and lands on /account still logged in
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Decision on AC #4 (owner): yes, an e2e on another site. The GitLab provider of make e2e now has its issuer at http://127.0.0.1:4580/gitlab, so every GitLab login in the e2e suite crosses sites like a real provider; Entra stays on localhost.
- The cancel is simulated by navigating from the provider page (script on 127.0.0.1) to the callback with error=access_denied and the flow's state, since the mock has no cancel button.
- Verified the e2e fails without the fix (landed on /login?problem=oidc-failed) and passes with it.
- Refusals before a flow exists (missing or unreadable cookie) still go to /login, through the forwarding page; an expired flow keeps its link target.
- The back-or-reload redirect for a logged-in user without a flow stays a 303: that request comes from this site.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every refusal of the OIDC callback is now answered through the forwarding page instead of a 303, and returns to /account when the flow was a link (expired flows included). callback.spec tells forwards from redirects and covers cancel, provider down, expired and blocked link flows. make e2e now runs the GitLab mock on another site (127.0.0.1); manage.e2e cancels a link at the provider and stays logged in on /account — failed before the fix, passes after.
<!-- SECTION:FINAL_SUMMARY:END -->

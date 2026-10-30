---
id: TASK-126
title: Reject language switch targets that browsers read as another origin
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 09:45'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 188000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. The redirect guard in `app/src/routes/language/+server.ts` (around line 21) is meant to prevent an open redirect, but accepts `/\t/evil.example`: browsers strip the tab and read `//evil.example`, a protocol-relative URL to another host (`new URL('/\t/evil.com', base)` yields `https://evil.com/`). Today it cannot be triggered from another site because SvelteKit rejects cross-site form POSTs, but the guard does not do what its comment claims, and it would be the only line of defence if that check changed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The target is resolved against the request URL and the redirect only happens when the resolved origin equals the request origin; otherwise it falls back to the same default as other rejected targets
- [ ] #2 Tests cover `/\t/evil.example`, `//evil.example`, `/\\evil.example`, absolute URLs and a normal same-origin path with query string
<!-- AC:END -->

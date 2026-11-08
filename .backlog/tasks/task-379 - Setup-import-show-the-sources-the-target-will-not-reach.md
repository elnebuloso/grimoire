---
id: TASK-379
title: 'Setup import: show the sources the target will not reach'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 14:26'
updated_date: '2026-11-08 15:01'
labels:
  - ops
dependencies: []
priority: medium
type: bug
ordinal: 441000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR 0009 decides that an import names the sources whose Git host the target refuses, instead of leaving it to their first failed sync. scripts/import.ts prints them, but the browser import on the setup page (app/src/routes/setup/+page.server.ts:79-81) only writes them to the server log and redirects to /login?imported, so the person importing without a shell is never told (deviation found while consolidating the ADRs on 2026-11-08).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After an import on the setup page, the person importing sees the names of the sources the target will not reach
- [x] #2 An import without such sources shows no such notice
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Setup import action passes the slugs refusedSources finds to the login redirect as repeated refused parameters.
2. Login load keeps only slugs of existing sources (no text injection through the URL) and the page shows them in a notice next to the import notice.
3. New message in en and de; spec in import.spec.ts with a proxy set so every unlisted host is refused without DNS; login spec for the filter; e2e still green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The setup action passes the slugs refusedSources finds as repeated refused parameters to /login?imported; the login load keeps only slugs of existing sources, so a crafted link cannot put text on the page. Evidence: import.spec.ts (with HTTPS_PROXY stubbed every unlisted host is refused without DNS; the redirect names each imported source; fails before the change), login.spec.ts (names existing slugs, drops unknown text, nothing without refused), manage.e2e.ts 22/22 (import without refused sources still lands on /login?imported), agent environment: /login?imported&refused=billing-docs&refused=Fake%20text shows the notice with billing-docs only. Handbook moving.md updated.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An import on the setup page now names the sources the target will not reach: the login page it leads to shows 'These sources cannot sync on this instance: <slugs>. The server log names the reason for each.', as ADR 0009 requires; before, only the server log had them. Only slugs of existing sources are shown. Verified with import.spec.ts, the new login.spec.ts, manage.e2e.ts and by hand in the agent environment. Not run: make lint and the full suites, due before the push.
<!-- SECTION:FINAL_SUMMARY:END -->

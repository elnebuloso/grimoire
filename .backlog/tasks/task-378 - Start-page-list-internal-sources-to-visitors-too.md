---
id: TASK-378
title: 'Start page: list internal sources to visitors too'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 14:26'
updated_date: '2026-11-08 14:52'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 440000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ADR 0012 decides that the start page shows every source to anyone, so users can tell how much documentation the instance holds before logging in. Today app/src/routes/+page.server.ts filters the catalog with viewerScope('visitor'), so a visitor sees only public sources (deviation found while consolidating the ADRs on 2026-11-08).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A visitor without login sees every source on the start page with name, description, visibility and stats
- [x] #2 For an internal source a visitor sees no content and no link to the published documentation (docsUrl stays public-only)
- [x] #3 Nothing reachable from a listed internal source (source page, try-it links) reveals its content to a visitor
- [x] #4 The handbook describes what the start page shows to visitors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the DataTable setup of /manage/sources into a shared SourceTable component (name snippet, optional dead-links href).
2. /manage/sources uses it, behaviour unchanged.
3. Start page lists sourceStats for everyone with SOURCE_LIST; docsUrl only for public; query scope unchanged, offered when the scope has sources.
4. SOURCE_LIST also searches the description; orphaned catalog messages removed.
5. Handbook admin.md and ARCHITECTURE.md describe the new start page.
6. Specs in page.spec.ts, stories for SourceTable, check in the agent environment.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decided with the user on 2026-11-08: the start page list behaves like /manage/sources for everyone (same columns, filters, sorts), without the New source button and without any link into /manage, also for admins; description and the docs link of public sources stay. Shared component SourceTable for both lists. SOURCE_LIST now also searches the description. Evidence: page.spec.ts (visitor lists every source, row fields, docs link public-only, status filter, visitor query public-only), SourceTable stories light/dark with axe, manage.e2e.ts 22/22 (visitor row without links, no Git host, error message, token or username in the page), agent environment: visitor sees all four fixture sources, Try a query returns billing-docs only.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start page lists every source to anyone, as ADR 0012 decides: the same table, filters and sorts as /manage/sources through the new shared component SourceTable, without the New source button and without links into the management area. Visitors see state, counts and dead-link numbers but no error messages, settings or content; Try a query still reads only the viewer's scope, and the docs link stays for public sources. Handbook (admin.md, users.md) and ARCHITECTURE.md describe it. Verified with page.spec.ts, the SourceTable stories, sources.spec.ts, status.spec.ts, manage.e2e.ts and by hand in the agent environment in light and dark. Not run: make lint and the full suites, due before the push.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-230
title: 'Try a query on the start page only, across every source the viewer may read'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 01:23'
updated_date: '2026-11-03 01:31'
labels:
  - admin
dependencies: []
priority: medium
type: enhancement
ordinal: 292000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two forms let people try a search: Try a query on the start page searches only public sources, `/manage/query` what the user may read, both with source checkboxes. Since every viewer now sees only what they may read, one form is enough: on the start page, without choosing sources, across everything the viewer may read: public sources for a visitor, what their own API keys would read for a logged-in user.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The start page searches the public sources for a visitor and the sources the logged-in user may read (public, internal, own private)
- [x] #2 The form offers no source selection
- [x] #3 `/manage/query` no longer exists and the management navigation does not link it
- [x] #4 Queries without results link to the start page form with the question filled in
- [x] #5 Handbook pages name Try a query on the start page instead of the management area
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. answerQueryForm(db, url, scope) without source list or ?source=.
2. QueryForm without the checkboxes; stories adjusted.
3. Start page: 'public' for visitors, readableSlugs for logged-in users; form shown once any source is readable.
4. Remove /manage/query and its nav entry; move its ownership test to page.spec.ts.
5. Missed queries link to /?q=…#query.
6. Messages, handbook, e2e adjusted.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Try a query exists only on the start page and has no source selection: a visitor searches the public sources, a logged-in user everything their API keys would read (readableSlugs), admins included. answerQueryForm no longer takes a source list or ?source=; QueryForm and its stories lost the checkboxes. /manage/query, its spec and its nav entry are gone; its ownership test moved to page.spec.ts. Queries without results link to /?q=…#query. Messages query_sources and query_intro removed, start_query_intro rewritten; handbook admin, users and agents pages updated. make lint, make test (802), make e2e (23) and make handbook pass; checked in the agent environment (visitor finds only billing-docs, user also platform-docs; /manage/query 404) and the form in dark mode.
<!-- SECTION:FINAL_SUMMARY:END -->

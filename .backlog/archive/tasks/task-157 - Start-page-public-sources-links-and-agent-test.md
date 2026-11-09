---
id: TASK-157
title: 'Start page: public sources, links and agent test'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 14:51'
updated_date: '2026-10-30 15:27'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-156
priority: medium
type: feature
ordinal: 219000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Visitors of the start page cannot tell which documentation they may use without a key, and cannot try what an agent would get. With visibility per source, the start page can mark each source and offer the published docs and a query test for the public ones.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The start page lists every source marked public or private, each with its stats
- [x] #2 Public sources show their `docs_url` link; private sources show neither `docs_url` nor Git URL
- [x] #3 Visitors who are not logged in can run an agent query against the public sources, as in the admin query page; private sources are never searched there
- [x] #4 Tests cover that private content and URLs never reach a visitor who is not logged in
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Source table shows visibility (from TASK-156) and links docs_url, which stats return for public sources only
2. Query form logic to lib/server/query-form.ts and markup to QueryForm.svelte, used by Manage > Try a query and the start page
3. Start page offers the form while a public source exists, searching scope 'public' without recording misses
4. Tests (start page route, stats, stories), handbook
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start page lists every source with public/private, its stats, and for public sources the documentation link; stats return `docsUrl` only for public sources, so a private one's address never reaches the page. While at least one source is public, the start page offers **Try a query** to everyone, answered like `query` within the public sources only and not recorded as a missed query. The query form is shared with `Manage > Try a query` (`QueryForm.svelte`, `lib/server/query-form.ts`). The connect hint now says the key is needed only for private sources.

Verified: `make lint` clean, `make test` 613 green (new: start page offers/answers public sources only, private source in the form is not found, no missed query, docs URL public only, QueryForm stories), `make e2e` 18/18, `make handbook` strict; by hand in the agent environment without login: answer only from billing-docs, its docs link shown, the private source's docs URL absent.
<!-- SECTION:FINAL_SUMMARY:END -->

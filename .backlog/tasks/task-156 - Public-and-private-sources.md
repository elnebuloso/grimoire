---
id: TASK-156
title: Public and private sources
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 14:51'
updated_date: '2026-10-30 15:19'
labels:
  - agent-api
  - admin
milestone: m-0
dependencies:
  - TASK-155
priority: high
type: feature
ordinal: 218000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some documentation may be read by anyone, some only with an API key. Visibility is set per source, which is only simple to configure once projects are gone. Making a source public exposes its content to anyone who can reach the instance and cannot be undone for whoever already read it, so new sources start private.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A source is public or private; new sources are private
- [x] #2 A request without an API key reads and searches the public sources only
- [x] #3 A request with an API key sees the public sources plus the ones its key is scoped to; a key for all sources sees everything
- [x] #4 Without an API key and with no public source, MCP and HTTP answer 401 as today
- [x] #5 Queries without an API key are not recorded as missed queries
- [x] #6 The admin area shows and changes the visibility per source; the handbook states who can read what
- [x] #7 Tests cover the scope with no key, a scoped key and an all-sources key
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. sources.public (default 0)
2. Caller scope 'public' for requests without a key; IN_SCOPE always admits public sources, so a key selection sees its sources plus the public ones; KeyScope separates what a key stores from what a caller sees
3. No key: public scope while a public source exists, otherwise 401; an invalid key stays 401
4. agentQuery records no missed query for the public scope
5. Admin: Public checkbox on the source form, Visibility column in the source table (dashboard and start page)
6. Tests and handbook
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sources carry `public` (off for new ones). A request without an API key gets the scope `'public'` while at least one public source exists, otherwise 401 as before; a sent key that is unknown or expired stays 401. The scope filter always admits public sources, so a key limited to a selection sees its sources plus the public ones and a key for all sees everything. Queries without a key are not recorded as missed queries. The admin sets **Public** on the source form; the source table on the dashboard and start page shows the visibility. Handbook (concepts, admin, agents) describes who reads what.

Verified: `make lint` clean, `make test` 603 tests green (new: anonymous list/search/read, key selection plus public, invalid key 401, no missed query without key, MCP without key, visibility toggle, stats visibility, story), `make e2e` 18/18, `make handbook` strict; by hand in the agent environment: 401 without public source, anonymous `/sources` lists only public ones, private index 404, the checkbox saved through the admin form.
<!-- SECTION:FINAL_SUMMARY:END -->

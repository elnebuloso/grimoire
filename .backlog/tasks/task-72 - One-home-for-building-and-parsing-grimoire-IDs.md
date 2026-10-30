---
id: TASK-72
title: One home for building and parsing grimoire IDs
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:28'
labels:
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/operations.ts
priority: medium
type: chore
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

The ID form `project/source/page#anchor` (page path with `.md` stripped) is assembled independently in:
- `app/src/lib/server/agent/operations.ts` (around :77 and :127)
- `app/src/lib/server/search/query.ts:121` (`snippetId`)
- `app/src/lib/server/db/links.ts:36`
- `app/src/lib/server/parsing/links.ts:52`

`app/src/lib/server/admin/status.ts:86` does the reverse, and `operations.ts:164-166` parses it back.

Any change to IDs (a branch in the ID, another page extension, escaping `#` in a file name) means changing all of these in step; missing one breaks links or `read` silently. `snippetId` is the natural single home, with a parsing counterpart next to it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 IDs are built by one function and parsed by one function; no other code concatenates or splits the ID form
- [x] #2 Unit tests cover building and parsing, including pages with and without anchor and nested paths
- [x] #3 Existing behaviour and stored IDs stay unchanged
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module app/src/lib/server/grimoire-id.ts with grimoireId(page, anchor) and parseGrimoireId(id), plus tests.
2. Route every site through it: operations.ts (index, llmsTxt URL path, readById), search/query.ts (replaces snippetId), db/links.ts, parsing/links.ts, admin/status.ts, and the /p route.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
snippetId was a one-line wrapper after the change and was removed; its two callers use grimoireId directly. The module lives in app/src/lib/server/ (not parsing/) and is imported with a .ts extension from parsing/links.ts, which the index worker loads under plain Node. parseGrimoireId splits at the first '#' instead of split('#', 2); identical for every ID grimoire produces. The /p route and llmsTxt also derive their paths from grimoireId now, found by grepping beyond the review's list.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Building and parsing grimoire IDs (project/source/page#anchor) now happens only in app/src/lib/server/grimoire-id.ts. The seven places that concatenated or split IDs by hand use it, so a future change to the ID format happens in one file. Behaviour and stored IDs are unchanged: all existing tests pass. New unit tests cover building, parsing, anchors and nested paths. Verified with make lint, make test (469 passed) and the /p route in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

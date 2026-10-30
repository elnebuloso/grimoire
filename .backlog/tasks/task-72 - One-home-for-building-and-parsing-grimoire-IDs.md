---
id: TASK-72
title: One home for building and parsing grimoire IDs
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
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
- [ ] #1 IDs are built by one function and parsed by one function; no other code concatenates or splits the ID form
- [ ] #2 Unit tests cover building and parsing, including pages with and without anchor and nested paths
- [ ] #3 Existing behaviour and stored IDs stay unchanged
<!-- AC:END -->

---
id: TASK-82
title: >-
  Pass page locations to readById instead of ID strings, and make pages with #
  in the file name readable
status: To Do
assignee: []
created_date: '2026-10-30 01:34'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-81
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/grimoire-id.ts
  - 'app/src/routes/p/[project]/[source]/[...page]/+server.ts'
  - app/src/lib/server/admin/status.ts
  - app/src/lib/server/agent/mcp.ts
  - app/src/lib/server/sync/index-source.ts
priority: medium
type: bug
ordinal: 144000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`readById` in `app/src/lib/server/agent/operations.ts` takes a grimoire ID string and parses it with `parseGrimoireId` (`app/src/lib/server/grimoire-id.ts`). Internal callers already have the parts: the HTTP page route `app/src/routes/p/[project]/[source]/[...page]/+server.ts` has project, source, file and section as separate values and joins them with `grimoireId` only so `readById` can split them again; `previewPage` in `app/src/lib/server/admin/status.ts` does the same. Only the MCP `read` tool (`app/src/lib/server/agent/mcp.ts`) really receives a string.

The round trip is lossy: `parseGrimoireId` splits at the first `#`, while `listPages` in `app/src/lib/server/sync/index-source.ts` accepts any `*.md`, so `c#.md` or `faq#2.md` is indexed, listed and searchable but cannot be read:
- over MCP, the ID from `index` or a snippet's "Source:" line does not resolve
- over HTTP, `%23` decodes into `params.page` and fails the same way
- `llms.txt` links to a URL that returns 404
Nothing reports it. Every future change to the ID grammar (escaping, a branch segment) also has to pass through a string format internal code does not need.

For `#` in file names there are two options: escape it in `grimoireId`/`parseGrimoireId`, or refuse such files at sync with a warning. Either way it is decided once, in `grimoire-id.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `readById` takes a page location (project, source, file) plus an optional anchor; the ID string is parsed only at the MCP tool boundary
- [ ] #2 The HTTP page route and `previewPage` pass their parts directly without building an ID
- [ ] #3 A page whose file name contains `#` is either readable via its listed ID, HTTP URL and `llms.txt` link, or is not indexed and the sync reports a warning – no listed page is unreadable
- [ ] #4 Tests cover the `#` case through the public interface and fail on the old code
<!-- AC:END -->

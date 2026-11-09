---
id: TASK-82
title: >-
  Pass page locations to readById instead of ID strings, and make pages with #
  in the file name readable
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 01:34'
updated_date: '2026-10-30 01:43'
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
- [x] #1 `readById` takes a page location (project, source, file) plus an optional anchor; the ID string is parsed only at the MCP tool boundary
- [x] #2 The HTTP page route and `previewPage` pass their parts directly without building an ID
- [x] #3 A page whose file name contains `#` is either readable via its listed ID, HTTP URL and `llms.txt` link, or is not indexed and the sync reports a warning – no listed page is unreadable
- [x] #4 Tests cover the `#` case through the public interface and fail on the old code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `readById` takes a `SectionLocation` (PageLocation + optional anchor, new in grimoire-id.ts); only the MCP `read` tool parses the ID string, answering `idNotFound` when it names no page.
2. HTTP page route and `previewPage` pass their parts directly.
3. `#` in file names: refuse at sync. `hasGrimoireId` in grimoire-id.ts decides it; `prepareCheckout` skips such files with a warning. Escaping was rejected: the ID would carry an escape through the index, stored links, llms.txt URL encoding and the HTTP route, for a file name that docs sites rarely use.
4. Tests: skipped `#` file with warning; unparseable ID over MCP; handbook writing.md row.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
An empty anchor now reads the whole page on both adapters (`location.anchor || null` in `readById`), because the HTTP route no longer goes through `grimoireId`, which used to drop it; before, `?section=` read the page and an MCP ID ending in `#` got 404. This settles the empty-section point of TASK-86. Tests that failed on the old code: index-source.spec "skips the page, whose ID would name another page", agent-api.spec "reads the whole page for an empty anchor". 461 unit tests, make lint and make handbook pass; agent environment: section over HTTP and MCP, and `?section=`, all 200.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`readById` takes a page location plus an optional anchor; only the MCP `read` tool parses the ID string. The HTTP page route and `previewPage` pass their parts directly instead of building an ID to parse again. A Markdown file with `#` in its name is now skipped at sync with the warning `<path>: "#" in the file name, skipped` (rule in `hasGrimoireId`, documented in docs/handbook/writing.md), so no listed page is unreadable any more. Side effect: an empty anchor reads the whole page over both HTTP and MCP. Verified by new tests that fail on the old code, the full unit suite, make lint, make handbook and requests against the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

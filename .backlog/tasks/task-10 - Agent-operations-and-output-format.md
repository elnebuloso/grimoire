---
id: TASK-10
title: Agent operations and output format
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T21:41:00Z'
labels:
  - agent-api
milestone: m-0
dependencies:
  - TASK-9
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
HTTP and MCP offer the same four operations and must answer identically, so the operations and their Markdown output live in one place. The instructions text sits permanently in agent context, so it stays short and is maintained once for both channels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `projects` lists projects with their short description
- [x] #2 `index <project>` lists pages and sections with their IDs
- [x] #3 `query` returns snippets in the format of `docs/konzept.md`: heading with title path, `Source:` line with the ID, `Edit:` line with Git URL without credentials, branch and file
- [x] #4 `read` returns a whole page or a single section by ID; an unknown ID returns a clear not-found message
- [x] #5 The agent instructions text exists once, is under 250 tokens and is used by both HTTP and MCP
- [x] #6 Tests cover each operation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module `app/src/lib/server/agent/operations.ts` with `projects`, `index`, `query`, `read`. Each takes the db and an optional `allowedProjects` (API key scope), so a project outside the scope behaves like a missing one in every operation. Each returns `{ found: boolean, markdown: string }`, so HTTP can answer 404 and MCP the same message.
2. `projects`: one line per visible project, `- <slug>: <description>`, sorted by slug.
3. `index <project>`: per source a heading, per page (sorted by file; nav is not parsed anywhere) the page ID and title, below it its sections with IDs, indented by heading depth (from the title path length). Split parts appear once, without the ` (1/2)` suffix. Unknown or hidden project -> not found.
4. `query`: wraps `searchSnippets`; empty result -> 'No results' message pointing at other terms and `index`.
5. `read <project>/<source>/<page>[#anchor]`: page ID -> all snippets of the page in order, each rendered with `renderSnippet` (built from snippets because `pages.content` has unrewritten links). With anchor -> the snippet(s) whose `anchor` matches (all parts of a split section) or whose `aliases` contain it. The overview has no anchor of its own; it is the first block of the whole page. Unknown ID -> not found.
6. Agent instructions in `app/src/lib/server/agent/instructions.md` (text from `docs/konzept.md`), imported once with `?raw` and exported for HTTP and MCP.
7. Tests in `operations.spec.ts` per operation incl. scope, split parts, aliases, not-found; instructions under 250 tokens via `estimateTokens`.
8. `make test`, `make lint`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: (1) `read <page>#<anchor>` must also look up `Snippet.aliases` (anchors of merged small subsections). (2) The overview snippet has no anchor, so its ID equals the page ID; `read` on the page ID returns the whole page – decide deliberately how the overview is addressed.

Handoff from TASK-6: IDs keep the file name as written, so they can contain spaces or other characters that need URL encoding over HTTP. A link to a page's H1 anchor (`ChunkedPage.titleAnchor`) resolves to the page ID without anchor.

Handoff from TASK-7: `pages.content` holds the preprocessed Markdown of the whole page; its links are not rewritten to grimoire IDs (only snippet contents are). If `read` returns a whole page, build it from the snippets or rewrite its links too.

Decided with the user: the agent instructions say nothing about when changes reach grimoire (no sync interval, no "after the next sync"). The interval is an operator setting and none of the agents' business; the line was removed from the draft in `docs/konzept.md`.

Decided with the user: a whole page is rendered from its snippets, each as the same block as in `query` (so `Edit:` repeats per section); the overview has no own address and is the first block of the page; `index` follows the file tree, not `nav` (nav is not parsed).

Handoff to TASK-11/12/13: every operation takes a `ProjectScope` (`string[] | undefined` = all) and returns `{ found, markdown }`; `found: false` -> HTTP 404, same Markdown. Out-of-scope projects return the same message as unknown ones. `agentInstructions` (from `app/src/lib/server/agent/instructions.md`) is the text for `/instructions` and the MCP server instructions. A link to a page's H1 anchor resolves to the page ID, so `read` never sees that anchor.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `app/src/lib/server/agent/operations.ts` with `listProjects`, `indexProject`, `queryProjects` and `readById`, all scoped by an optional project list and returning `{ found, markdown }`, plus the agent instructions text in `instructions.md` (under 250 tokens, tested). `read` builds pages from snippets (links already rewritten), returns all parts of a split section and resolves merged-subsection anchors via `aliases`. While testing with real chunked pages a rendering bug in `renderSnippet` surfaced (trailing newline of stored content); fixed separately with a regression test. `make test` (128 passed) and `make lint` green.
<!-- SECTION:FINAL_SUMMARY:END -->

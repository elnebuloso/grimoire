---
id: TASK-73
title: Slug rename is only complete after a successful re-sync
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 01:14'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-72
references:
  - app/src/lib/server/parsing/chunk.ts
  - app/src/lib/server/parsing/links.ts
  - app/src/lib/server/db/links.ts
priority: medium
type: bug
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

Project and source slugs are baked into the indexed content:
- the title path starts with project and source slug (`app/src/lib/server/parsing/chunk.ts:107`) and is stored and searched as the snippet heading;
- relative links are rewritten to full IDs inside `snippets.content` (`app/src/lib/server/parsing/links.ts:52,74`);
- `links.target` stores them too.

That is why the slug actions queue forced syncs (`app/src/routes/manage/projects/[id]/+page.server.ts:51-55`, `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts:156-159`). If that sync fails (broken token, unreachable host: on every attempt), the index keeps old IDs indefinitely. The source answers `read` under its new slug, but links inside its content lead agents to "not found", and nothing marks them dead because dead-link detection also runs only on sync. Renaming a project with 50 sources costs 50 forced full clones.

Review suggestion: store slug-free data (source-relative file and anchor) and add the slugs when content is rendered, or rewrite the stored prefixes in the same transaction as the slug `UPDATE`. Either way a rename becomes one write that cannot half-fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After renaming a project or source slug, search, `read` and links inside content use the new slug immediately, without a sync
- [x] #2 A rename no longer queues forced syncs
- [x] #3 Tests cover a rename of a project slug and of a source slug, including links between sources
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Decided with the user: store the index without slugs and add them when it is read.
1. grimoire-id.ts: pageId(file, anchor) for the source-relative part; stored internal links use the prefix grimoire: (e.g. grimoire:guides/setup#install); withSlugs(content, project, source) turns them into full IDs.
2. chunk.ts: title paths start with the page title (no project/source); chunkPage takes the file only.
3. links.ts: links.target and link URLs in content are source-relative; resolveLinks needs no project/source.
4. search/query.ts toSnippetHit puts project and source in front of the title path and expands links in content; operations.ts index depth adjusts. FTS title_path no longer holds the slugs.
5. Slug actions no longer queue forced syncs; handbook admin.md updated.
6. Migration 0011 rewrites existing rows (title_path, snippets_fts.title_path, links.target, link URLs in content) without a re-sync.
7. Tests: rename of project and source slug shows the new slug in search, read and links without a sync; migration test from the old format.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Stored format: title_path starts with the page title; links.target is the ID within the source (page#anchor), or the link as written when it leaves the source path; live links in snippet Markdown are stored as grimoire:<page>#<anchor> and expanded by withSlugs in toSnippetHit, the one place stored snippets are read (search and read). The FTS title column no longer holds the slugs, so a query word that is only a project or source slug no longer matches a heading.

Orphans removed with it: project/source in PagesToIndex, IndexedSource and SyncSource, which only fed the title paths and link IDs.

Migration 0011-index-without-slugs.sql rewrites existing rows; checked on a copy of the agent environment's synced database (no prefixed links, title paths or targets left) and live: after restarting the agent environment, renaming platform to team answered read with team/... links and headings at once, no sync in the log. Agent environment reset afterwards.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Slugs are no longer stored in the index. Title paths, link targets and the links inside snippet Markdown are kept relative to their source, and project and source slugs are added when snippets are read. Renaming a project or source slug therefore takes effect at once in search, read, index and the links between pages, and no longer queues forced syncs (50 sources meant 50 full clones). Migration 0011 converts existing indexes without a re-sync. Verified by a rename test over the agent operations, unit tests for withSlugs and the migration, the migration run on real synced data, a live rename in the agent environment, make lint, make test (483 passed), make e2e (15 passed) and make handbook. Side effect: a query word that is only a slug no longer matches the heading column of the search.
<!-- SECTION:FINAL_SUMMARY:END -->

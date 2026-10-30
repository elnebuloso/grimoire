---
id: TASK-88
title: 'Admin: preview a page as the snippets it is split into'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:13'
labels:
  - admin
  - parsing
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
documentation:
  - docs/concept.md
priority: medium
type: feature
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The concept promises "a preview of the snippets" per source. The source page today shows only the whole page as `read` returns it, so how a page is cut into snippets – and whether a section ends up too large, too small or under a misleading title path – stays invisible. That split is what search ranks and what the token budget packs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The page preview on the source page lists the page's snippets in order, each with its ID, title path and estimated tokens
- [x] #2 Each snippet's content is shown as it is stored in the index
- [x] #3 A page without snippets says so instead of showing an empty list
- [x] #4 Tests cover loading the snippets of a page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Snippet hits carry their stored token estimate (snippets.tokens).
2. operations.ts: readSnippets(db, location, scope) returns the hits readById renders, so the preview and read share one lookup.
3. previewPage returns the page's snippets (ID, title path, tokens, rendered block as read returns it), an empty list for a page without snippets, undefined for an unknown page.
4. Source page renders the preview as an ordered list, one entry per snippet; an empty list says the page has no snippets.
5. status.spec: snippets in order with ID/title path/tokens, empty page, unknown page.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SnippetHit carries snippets.tokens; readSnippets in agent/operations.ts is the lookup behind readById and the preview. The preview keeps each snippet rendered as read returns it (Source/Edit lines, content with slugs as agents see it) and adds title path, ID and tokens above it. Verified: status.spec (3 preview tests incl. empty page vs. missing page), projects.spec, make lint, server tests 480 passed; by hand in the agent environment on platform/docs index.md (4 snippets with ID and tokens).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The page preview on a source page now lists the page's snippets in order, each with title path, grimoire ID and estimated tokens above the block read returns for it; a page without snippets says so instead of claiming the page is missing. readById and the preview share readSnippets. Handbook updated. Verified with unit tests, make lint and in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

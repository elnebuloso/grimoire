---
id: TASK-142
title: Move splitCode from the database module into parsing/
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 10:55'
updated_date: '2026-10-30 11:20'
labels:
  - parsing
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 204000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the second whole-project code review of 2026-10-30. `splitCode` in `app/src/lib/server/db/sources.ts` (around lines 302-316) parses Markdown to separate code blocks from prose for search weighting. Markdown parsing belongs in `app/src/lib/server/parsing/`, which is pure; with it in `db/`, the database module reaches `remark`. `replaceSourceIndex` uses it (around line 135), and `app/src/lib/server/sync/sync.spec.ts` tests it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `splitCode` lives in `app/src/lib/server/parsing/` and `db/sources.ts` no longer imports Markdown parsing
- [x] #2 Search texts are unchanged; the existing `splitCode` test passes from its new place
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move splitCode to parsing/markdown.ts (next to parseMarkdown), its test to parsing/markdown.spec.ts.
2. IndexedPage gets searchTexts; indexPages (worker) computes them after links are resolved, replaceSourceIndex only writes them, so db/sources.ts no longer imports any Markdown parsing.
3. Test helpers that build IndexedPage by hand pass searchTexts.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
splitCode moved from db/sources.ts to parsing/markdown.ts with its test (parsing/markdown.spec.ts). IndexedPage now carries searchTexts, computed by indexPages in the worker; replaceSourceIndex only writes them, so db/sources.ts imports neither remark nor mdast. Three spec helpers that build pages by hand pass searchTexts. The splitCode test passes from its new place; make lint and all 559 server and route specs pass, including the sync specs that run the real indexing worker.
<!-- SECTION:FINAL_SUMMARY:END -->

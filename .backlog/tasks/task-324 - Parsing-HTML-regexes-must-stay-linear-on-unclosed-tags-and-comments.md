---
id: TASK-324
title: 'Parsing: HTML regexes must stay linear on unclosed tags and comments'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - parsing
  - sync
dependencies: []
references:
  - app/src/lib/server/parsing/preprocess.ts
  - app/src/lib/server/parsing/slugs.ts
priority: high
type: bug
ordinal: 386000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`preprocessPage` in `app/src/lib/server/parsing/preprocess.ts` removes raw HTML with `HTML_COMMENT = /<!--[\s\S]*?-->/g`, `HTML_IMAGE = /<img\b[^>]*>/gi` and `HTML_PICTURE_SOURCE = /<source\b[^>]*>/gi` (top of the file, used around lines 140-144), and the pymdownx slugify in `app/src/lib/server/parsing/slugs.ts` (around line 26) strips tags from heading text with `<\/?[^>]*>`. From every `<img`, `<source`, `<!--` or `<` that is never closed, each regex scans to the end of the input, so the time grows with the square of the input size.

Measured through `preprocessPage` on a page of `<div>` followed by `<img` repeated: 40 KB 0.48 s, 80 KB 2.1 s, 160 KB 8.0 s; `<!--` repeated: 0.27 s, 1.1 s, 4.0 s; a 160 KB heading of `<` takes 35 s in the slugify. Re-checked with the bare `HTML_IMAGE` regex: 20 KB 142 ms, 40 KB 440 ms. Indexing runs in a child process with a 10-minute deadline (`INDEXING_DEADLINE_MS`, `app/src/lib/server/sync/sync.ts`) and syncs share one slot, so a page or two of such content in any docs repo holds up the syncs of every other source for 10 minutes on every new commit. Page content is untrusted: anyone with push access to a docs repository writes it.

Suggested fix: use `[^<>]*` instead of `[^>]*` in the image, source and slug regexes so each attempt stops at the next `<`, and find comments with an `indexOf('<!--')` / `indexOf('-->')` loop. Measurement scripts of the audit: `/tmp/claude-1000/-workspace-github-com-elnebuloso-grimoire/f540d246-2462-4186-b45c-6b7fa42d5188/scratchpad/audit/regex.mjs` (may be gone; easy to rebuild from the numbers above).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Preprocessing a page of 200 KB of unclosed `<img`, `<source` or `<!--` takes well under a second
- [ ] #2 Slugifying a heading of 200 KB of `<` takes well under a second
- [ ] #3 Closed comments, images (alt text kept) and `<source>` tags are removed exactly as before (existing specs pass)
- [ ] #4 Specs in `preprocess.spec.ts` and the slug spec cover the unclosed inputs with a time limit
<!-- AC:END -->

---
id: TASK-350
title: 'Headings: an HTML image in a heading must not change its anchor'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/preprocess.ts
priority: medium
type: bug
ordinal: 412000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-338, `dropImagesInHeadings` in `app/src/lib/server/parsing/preprocess.ts` (around lines 132-147) removes Markdown images (`image`, `imageReference`) from headings, so the anchor matches Python-Markdown's toc. A raw HTML `<img>` in a heading is an `html` node, which `dropImageUrlsAndComments` (around line 165) then replaces with its alt text.

Case: `## Build <img src="https://ci.example.com/badge.svg" alt="status">` gives grimoire the anchor `build-status`; Python-Markdown 3.7 with toc and attr_list gives `build`. HTML images are common for sized badges, so links to `ci.md#build` count as dead and the snippet ID differs from the published site.

Suggested fix: in `dropImagesInHeadings`, also remove `HTML_IMAGE` matches from `html` children of the heading, and drop an `html` node that is empty afterwards. Check the expected anchor against Python-Markdown (`uvx --with markdown python -c …` or a scratch venv).

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A heading with an HTML `<img>` gets the anchor Python-Markdown gives it
- [ ] #2 HTML images outside headings are still replaced by their alt text
- [ ] #3 A spec in `preprocess.spec.ts` covers it
<!-- AC:END -->

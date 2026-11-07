---
id: TASK-350
title: 'Headings: an HTML image in a heading must not change its anchor'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:11'
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
- [x] #1 A heading with an HTML `<img>` gets the anchor Python-Markdown gives it
- [x] #2 HTML images outside headings are still replaced by their alt text
- [x] #3 A spec in `preprocess.spec.ts` covers it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec checked against Python-Markdown 3.7: `## Build <img … alt="status">` anchors `build`, `## <img … alt="logo"> Release` anchors `release`
2. dropImagesInHeadings also removes HTML_IMAGE matches from html nodes in the heading and drops a node left empty
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Expected anchors produced with Python-Markdown in the audit's scratch venv. The spec failed before (build-status) and passes after; parsing and index-pages specs pass (125 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Raw HTML `<img>` tags in headings are now removed like Markdown images, so a heading with an HTML badge gets the anchor MkDocs gives it (`build`, not `build-status`) and links to it are no longer dead. HTML images outside headings still become their alt text. Covered by the heading-image spec in preprocess.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

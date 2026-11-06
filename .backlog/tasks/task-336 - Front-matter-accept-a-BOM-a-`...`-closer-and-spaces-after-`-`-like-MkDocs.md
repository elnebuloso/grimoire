---
id: TASK-336
title: 'Front matter: accept a BOM, a `...` closer and spaces after `---` like MkDocs'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:22'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/preprocess.ts
priority: medium
type: bug
ordinal: 398000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`preprocessPage` in `app/src/lib/server/parsing/preprocess.ts` detects YAML front matter with a pattern around line 13 and reads it around lines 37-51. It differs from MkDocs (checked against MkDocs 1.6.1 and Python-Markdown 3.7):

1. BOM: `﻿---\ntitle: Deploy\ndescription: How to deploy\n---\n## Steps` gives the file name as title, and the YAML becomes a setext heading with anchor `title-deploy-description-how-to-deploy`. MkDocs reads pages as `utf-8-sig` and gets title "Deploy".
2. `...` closer: `---\ntitle: Deploy\n...\n\n## Steps\n\ntext\n\n---\n\nmore` makes everything up to the later `---` YAML; `parseYaml` throws "Source contains multiple documents" and the whole page is skipped. MkDocs' `YAML_RE` accepts `...`.
3. Spaces or tabs after the opening `---` are accepted by MkDocs (`-{3}[ \t]*\n`), not by grimoire.

Suggested fix: strip a leading `﻿` in `preprocessPage`, and use `/^---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m`. Check what Zensical does with these cases if it is documented; MkDocs is the reference otherwise.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A page starting with a BOM gets its front matter title, description and tags
- [x] #2 Front matter closed with `...` is read, and a later `---` in the page is content
- [x] #3 Spaces after the opening `---` are accepted
- [x] #4 Specs in `preprocess.spec.ts` cover the three cases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Specs: frontmatter after a BOM; closed by `...` with a later rule kept as content; spaces after the opening dashes
2. preprocessPage strips a leading BOM; FRONTMATTER accepts [ \t]* after the opening `---` and `---` or `...` as closer
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The three specs failed before and pass after; parsing and index-pages specs pass (121 tests).
- Zensical behaviour not checked (no documentation found offline); MkDocs 1.6.1 / Python-Markdown 3.7, as checked by the audit, is the reference.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Front matter is now read as MkDocs reads it: after a byte order mark, closed by `...` as well as `---`, and with spaces after the opening dashes. Pages starting with a BOM keep their title, and a page closing its front matter with `...` is no longer skipped as multiple YAML documents. Three specs in preprocess.spec.ts cover it.
<!-- SECTION:FINAL_SUMMARY:END -->

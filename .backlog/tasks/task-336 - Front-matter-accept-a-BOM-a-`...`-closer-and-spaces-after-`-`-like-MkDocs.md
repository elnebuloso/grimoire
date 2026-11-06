---
id: TASK-336
title: 'Front matter: accept a BOM, a `...` closer and spaces after `---` like MkDocs'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
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
- [ ] #1 A page starting with a BOM gets its front matter title, description and tags
- [ ] #2 Front matter closed with `...` is read, and a later `---` in the page is content
- [ ] #3 Spaces after the opening `---` are accepted
- [ ] #4 Specs in `preprocess.spec.ts` cover the three cases
<!-- AC:END -->

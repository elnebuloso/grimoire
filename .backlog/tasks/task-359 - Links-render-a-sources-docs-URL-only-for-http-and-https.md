---
id: TASK-359
title: 'Links: render a source''s docs URL only for http and https'
status: To Do
assignee: []
created_date: '2026-11-06 23:47'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/+page.svelte
  - app/src/lib/server/admin/sources.ts
  - app/src/lib/server/instance-import.ts
priority: low
type: bug
ordinal: 421000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source's `docsUrl` goes into an `href` on the start page (`app/src/routes/+page.svelte`, around line 52, shown to every reader) and on the source page (`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.svelte`, around line 115). `checkDocsUrl` in `app/src/lib/server/admin/sources.ts` (around lines 423-432) allows only http and https on save, but the import (`app/src/lib/server/instance-import.ts`, around lines 83-98, reached from `/setup`) copies rows as they are.

Case: an export file with `docs_url = 'javascript:…'`, imported on `/setup`, gives every reader a start-page link that runs script on click. It needs the operator to import a crafted file (the setup token from the server log is required), so the risk is low.

Suggested fix: render the link only when `new URL(docsUrl).protocol` is `http:` or `https:` (a small shared helper next to the source fields), or check the imported rows with `checkDocsUrl` and drop invalid values.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A source whose docs URL is not http or https shows no docs link
- [ ] #2 Valid docs URLs are linked as before
- [ ] #3 A spec covers a `javascript:` value
<!-- AC:END -->

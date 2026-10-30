---
id: TASK-183
title: Give every page a title
status: To Do
assignee: []
created_date: '2026-10-30 19:41'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 245000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No page sets a `<title>`: `app/src/app.html` has none and no route renders `<svelte:head><title>`. Browser tabs, history, bookmarks and screen readers therefore show the URL instead of a page name, and axe reports `document-title` on every page (found during TASK-179 to TASK-182, where the overflow/contrast checks had to switch that rule off).

Each page already has its heading as a message (e.g. `m.login_title()`, `m.source_title({ name })`), so the title can reuse it, followed by the product name, in the page's language. The error page needs one too (404, 403, unexpected).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page, including the error page in each of its states, has a `<title>` naming the page and grimoire, in the language of the page
- [ ] #2 The title of a source page names the source
- [ ] #3 axe `document-title` passes on every page
- [ ] #4 `make test` and `make e2e` pass
<!-- AC:END -->

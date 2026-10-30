---
id: TASK-183
title: Give every page a title and keep grimoire out of search engines
status: To Do
assignee: []
created_date: '2026-10-30 19:41'
updated_date: '2026-10-30 19:46'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 245000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire runs as an internal tool, not for search engines or the public (stated by the user). Two gaps follow from that.

**Titles.** No page sets a `<title>`: `app/src/app.html` has none and no route renders one. Browser tabs, history, bookmarks and screen readers show the bare URL instead of a page name, and axe reports `document-title` on every page (found during TASK-179 to TASK-182). Every page gets a title: the page name, then "grimoire" (e.g. "API keys – grimoire"; "Log in to grimoire" already names it), rendered from one shared place so no page can leave it out, server-rendered and in the language of the page. Dynamic pages adapt it to what they show:
- source page: the source's name; `New source` for `/manage/sources/new`
- source page with `?preview=<file>`: the previewed file
- error page: the state shown (404, 403, unexpected), never the internal message
Each page's heading already exists as a message (e.g. `m.login_title()`, `m.source_title({ name })`) and can be reused.

Deliberately not part of this: `meta description`, `link canonical` and Open Graph tags. They serve search results and public link previews, which an internal tool has no use for.

**No indexing.** Should a crawler reach an instance anyway (a misconfigured proxy, a public demo), nothing of it may end up in a search index: not the pages, and not the agent routes (`/mcp`, `/query`, `/sources`, `/sources/<slug>/llms.txt`, `/p/...`, `/instructions`), which serve the documentation itself as text and Markdown. Every page renders `<meta name="robots" content="noindex, nofollow">`, and every response carries `X-Robots-Tag: noindex, nofollow`, set once in `app/src/hooks.server.ts`, which also covers responses that are not HTML. `app/static/robots.txt` today allows crawling everything; for an internal tool `Disallow: /` is the expected content. Note that a crawler kept out by `robots.txt` never sees the `noindex`, so the header stays the actual guarantee.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page, including the error page in each of its states, renders a `<title>` naming the page and grimoire in the server response, in the language of the page
- [ ] #2 The title is rendered from one shared place; a page cannot render without it
- [ ] #3 On dynamic pages the title follows the content: a source page names the source, `/manage/sources/new` says New source, the preview names the file, the error page names its state
- [ ] #4 Every page renders `<meta name="robots" content="noindex, nofollow">`
- [ ] #5 Every response carries `X-Robots-Tag: noindex, nofollow`: pages, error pages, redirects and every agent route, set in one place in `app/src/hooks.server.ts`
- [ ] #6 `app/static/robots.txt` disallows all crawling
- [ ] #7 Tests cover the titles (static, source, preview, error states, German), the robots meta tag on every page, and the header on a page, an error page and an agent route
- [ ] #8 axe `document-title` passes on every page
- [ ] #9 The operator part of the handbook says that grimoire keeps itself out of search engines
- [ ] #10 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

---
id: TASK-183
title: Give every page a title and keep grimoire out of search engines
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 19:41'
updated_date: '2026-10-30 21:27'
labels:
  - admin
milestone: m-0
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
- [x] #1 Every page, including the error page in each of its states, renders a `<title>` naming the page and grimoire in the server response, in the language of the page
- [x] #2 The title is rendered from one shared place; a page cannot render without it
- [x] #3 On dynamic pages the title follows the content: a source page names the source, `/manage/sources/new` says New source, the preview names the file, the error page names its state
- [x] #4 Every page renders `<meta name="robots" content="noindex, nofollow">`
- [x] #5 `app/static/robots.txt` disallows all crawling
- [x] #6 Tests cover the titles (static, source, preview, error states, German), the robots meta tag on every page, and the header on a page, an error page and an agent route
- [x] #7 axe `document-title` passes on every page
- [x] #8 The operator part of the handbook says that grimoire keeps itself out of search engines
- [x] #9 `make lint`, `make test` and `make e2e` pass
- [x] #10 Every response SvelteKit resolves carries `X-Robots-Tag: noindex, nofollow`: pages, error pages and every agent route, set in one place in `app/src/hooks.server.ts`; redirects and errors thrown in a handle are out of reach and hold nothing indexable (agreed with the user)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. PageHead renders the document title from its title prop (page name – grimoire; a heading that already names grimoire stays as is), optional documentTitle for the preview; home and error page move to PageHead so every page goes through it
2. app.html renders the robots meta tag; a first handle in hooks.server.ts sets X-Robots-Tag on every response, redirects and errors included
3. robots.txt disallows everything; operator handbook names it
4. Tests: PageHead story for the title, unit test for the header handle, e2e over every page for title, meta tag and axe document-title, German and error states
5. make lint, make test, make e2e
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- PageHead renders <title> from its title prop ("<page> – grimoire" via m.document_title; a heading naming grimoire stays as is) and takes documentTitle for the preview and the error page. Start page and error page now render PageHead too, so every page goes through it; error titles live in src/routes/error-titles.ts with a unit test.
- app.html renders <meta name="robots" content="noindex, nofollow">; handleRobots, first in the hooks sequence, sets X-Robots-Tag via event.setHeaders; robots.txt disallows /; docs/handbook/docker.md (Reverse proxy) says so.
- Tests: PageHead stories check document.title; manage.e2e checks server-rendered title and robots meta on every page plus the header on a page, an error page and agent routes; language.e2e checks the German 404 title. Preview title and axe document-title checked by hand in the agent environment on all pages (0 violations).
- Gap (AC #5 open): responses produced by redirect()/error() thrown in handleAccess carry no X-Robots-Tag. SvelteKit builds those outside resolve (respond.js catch / handle_fatal_error), so setHeaders never reaches them. They hold nothing indexable (3xx, or SvelteKit's static error page).
- Pre-existing, found on the way: error() thrown in handleAccess (403 for non-admins, 404 on /setup after setup) always renders SvelteKit's static fallback page (handle_fatal_error -> static_error_page), not +error.svelte: no design, English only, title 'Error: 403', no robots meta. Needs a decision: follow-up task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every page now names itself in the browser tab, server-rendered and in the page language: PageHead sets the document title ("<page> – grimoire", headings naming grimoire as they are), with its own tab title for the source preview and the error states; start and error page render PageHead too. Pages carry a robots noindex meta tag, every response SvelteKit resolves carries X-Robots-Tag: noindex, nofollow (one handle in hooks.server.ts), robots.txt disallows all crawling, and the operator handbook says so.

Verified: make lint, make test (692), make e2e (22), make handbook; axe document-title passes on every page and the preview title was checked by hand in the agent environment.

Agreed limit: redirects and errors thrown in handleAccess carry no X-Robots-Tag, as SvelteKit builds them outside resolve. Follow-up TASK-184 makes access errors render +error.svelte instead of SvelteKit's static fallback page.
<!-- SECTION:FINAL_SUMMARY:END -->

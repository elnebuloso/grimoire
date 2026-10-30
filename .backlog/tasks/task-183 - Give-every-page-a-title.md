---
id: TASK-183
title: >-
  Give every page a title and the mandatory meta tags, and keep grimoire out of
  search engines
status: To Do
assignee: []
created_date: '2026-10-30 19:41'
updated_date: '2026-10-30 19:45'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 245000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
No page sets a `<title>` or any meta tag beyond `charset`, `viewport` and `text-scale` in `app/src/app.html`; no route renders `<svelte:head>` content apart from the favicon in `app/src/routes/+layout.svelte`. Browser tabs, history, bookmarks, screen readers and link previews in chat tools therefore show the bare URL, and axe reports `document-title` on every page (found during TASK-179 to TASK-182, where the overflow/contrast checks had to switch that rule off).

Every page gets the same mandatory set, rendered from one place so no page can leave a tag out:
- `<title>`: the page name, then "grimoire" (e.g. "Log in to grimoire" stays as it is, "API keys – grimoire")
- `<meta name="description">`: one sentence on what the page is for
- `<link rel="canonical">` and `og:url`: the absolute URL of the page, from the configured `BASE_URL` / origin
- Open Graph: `og:title`, `og:description`, `og:type` (`website`), `og:site_name` (`grimoire`), `og:locale` (from the page's language)
- `<meta name="robots" content="noindex, nofollow">`

Dynamic pages adapt their tags to what they show, server-rendered so the first response carries them:
- source page: the source's name in the title, its short description (if set) as description; `New source` for `/manage/sources/new`
- source page with `?preview=<file>`: the previewed file in the title
- error page: the title of the state shown (404, 403, unexpected), never the internal message
- every page: the language the page is rendered in (`de` gives German title and description)

Each page's heading already exists as a message (e.g. `m.login_title()`, `m.source_title({ name })`) and can be reused for the title; descriptions are new messages in every `app/messages/<locale>.json`.

No search engine indexes grimoire, decided with the user: not the start page, not the admin pages, and not the agent routes either (`/mcp`, `/query`, `/sources`, `/sources/<slug>/llms.txt`, `/p/...`, `/instructions`), which serve documentation as text and Markdown and would otherwise end up in search results. Besides the meta tag on pages, every response carries the header `X-Robots-Tag: noindex, nofollow`, set once in `app/src/hooks.server.ts`; that also covers responses that are not HTML. `app/static/robots.txt` today allows crawling everything.

Mind the trade-off when changing `robots.txt`: a crawler that is disallowed there never fetches a page and so never sees its `noindex`; search engines may then still list the bare URL when they find it linked elsewhere. `noindex` on every response is what keeps grimoire out of the index. Check current guidance of the major search engines before deciding what `robots.txt` says, and record the evidence in the implementation notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page, including the error page in each of its states, renders `<title>`, `meta description`, `link canonical`, `og:title`, `og:description`, `og:type`, `og:url`, `og:site_name` and `og:locale` in the server response, in the language of the page
- [ ] #2 The tags are rendered from one shared place (e.g. a component in `app/src/lib/components/` with stories); a page cannot render without them
- [ ] #3 On dynamic pages the tags follow the content: a source page names the source and uses its description, the preview names the file, the error page names its state
- [ ] #4 `canonical` and `og:url` are absolute URLs on the configured origin, without the query string except where it selects the content (`?preview=`)
- [ ] #5 A test fails when a route renders without one of the mandatory tags, and tests cover the dynamic cases (source name, preview file, error states, German)
- [ ] #6 axe `document-title` passes on every page
- [ ] #7 `make lint`, `make test` and `make e2e` pass
- [ ] #8 Every response of grimoire carries `X-Robots-Tag: noindex, nofollow`: pages, error pages, redirects and every agent route, set in one place in `app/src/hooks.server.ts`
- [ ] #9 Every page, the start page included, renders `<meta name="robots" content="noindex, nofollow">`
- [ ] #10 `app/static/robots.txt` no longer invites crawling everything; its content follows the trade-off in the description, with the evidence in the implementation notes
- [ ] #11 Tests cover the header on a page, an error page and an agent route, and the robots meta tag on every page
- [ ] #12 The operator part of the handbook says that grimoire keeps itself out of search engines and how
<!-- AC:END -->

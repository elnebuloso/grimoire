---
id: TASK-23
title: Include files by URL
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:05:00Z'
updated_date: '2026-10-29 22:37'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-4
  - TASK-7
references:
  - 'https://facelessuser.github.io/pymdown-extensions/extensions/snippets/'
documentation:
  - docs/decisions/0004-url-includes-only-from-allowed-origins.md
priority: low
type: enhancement
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With `url_download: true` in the site config, pymdownx.snippets accepts URLs as include targets (`--8<-- "https://…/file.md"`); nested includes inside such a file must be URLs as well. Off by default in pymdownx. grimoire currently reports such an include as "not found". Fetching during the sync means outgoing requests from the grimoire server to addresses chosen by whoever can commit to a source repo, so the decision needs weighing against internal network exposure (SSRF), timeouts and size limits before anything is built.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 URL includes are fetched only when the source's site config sets `url_download: true`; otherwise they are reported as a warning saying URL includes are disabled
- [x] #2 Fetching honours a timeout and a maximum size, and a failed fetch is reported as a warning without failing the sync
- [x] #3 A URL-included file may only include further URLs, as in pymdownx.snippets
- [x] #4 Requests cannot reach addresses an operator has not allowed (decision on the mechanism recorded before implementation)
- [x] #5 Unit tests cover a fetched include, the disabled case, a failed fetch and a local include inside a URL include
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ADR 0004 (decided with the user): fetch only from https origins listed in INCLUDE_URL_ALLOW, empty by default; url_download: true in the site config still has to switch it on.
2. site-config.ts: extensionSettings(settings, name) finds an extension's options in a mkdocs.yml list or a zensical.toml table, including dotted names nested by TOML (pymdownx.snippets); slugs.ts uses it for toc.
3. include.ts: URL targets go to a readUrl callback; undefined means not fetched yet and is collected in pendingUrls; without the callback (url_download off) a warning says URL includes are disabled; a local include inside a URL include is a warning; ranges, sections and cycle detection work as for files.
4. sync/url-include.ts: fetchInclude(url, allowedOrigins): only listed https origins, no redirects, no credentials, timeout 10 s, at most 1 MiB, every failure a message.
5. index-source.ts: site config read before resolving; the existing round loop also fetches pending URLs and resolves again until none is new; the allowed origins come from env INCLUDE_URL_ALLOW (env.ts, parsed and validated).
6. Tests: include.spec (fetched include, disabled, failed fetch, local include inside URL include, nested URL include), url-include.spec against a local HTTP server (allowed, not listed, redirect, timeout, size), site-config/extension lookup, env parsing; handbook (writing or docker page and env table).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Mechanism decided with the user and recorded first as docs/decisions/0004 (commit 9acb147): only https origins listed in INCLUDE_URL_ALLOW, empty by default.
include.ts takes an optional readUrl; without it (url_download not set) a URL include is a warning that URL includes are disabled; with it, unfetched URLs come back as pendingUrls and indexCheckout fetches them in the same round loop that already fetched directories outside the source path, so nested URL includes resolve in later rounds. The site config is now read before includes are resolved. extensionSettings in site-config.ts finds options of dotted extension names in both mkdocs.yml and zensical.toml (where TOML nests them); slugs.ts uses it for toc.
fetchInclude: no redirects (redirect: manual), credentials in the URL refused, 10 s timeout, 1 MiB limit, every failure a problem string; nothing throws. Limits are fixed rather than taken from pymdownx's url_timeout/url_max_size, so a repository cannot raise them.
Verified: make lint, make test (446), make e2e (15), make handbook; built server stops on INCLUDE_URL_ALLOW=http://docs.example.com; live fetch from raw.githubusercontent.com when listed, refused when not listed, a github.com redirect not followed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pages can include files by URL like pymdownx.snippets with url_download: true. grimoire fetches them during the sync only from https origins the operator lists in INCLUDE_URL_ALLOW (empty by default: none), follows no redirect, refuses credentials in the URL, and stops after 10 seconds or 1 MiB. Without url_download the include is a warning that URL includes are disabled; a failed or refused fetch is a warning and the sync goes on. A file included by URL may include further URLs only; ranges, sections and cycle detection work as for files.

Decision in docs/decisions/0004 (Proposed). Covered by unit tests for include resolution, the fetcher against a local HTTP server, the round loop in indexCheckout and the config lookup; documented in writing.md, database.md, docker.md and app/.env.example.
<!-- SECTION:FINAL_SUMMARY:END -->

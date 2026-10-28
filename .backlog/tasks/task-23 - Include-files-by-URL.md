---
id: TASK-23
title: Include files by URL
status: To Do
assignee: []
created_date: '2026-10-28T20:05:00Z'
labels:
  - parsing
milestone: m-1
dependencies:
  - TASK-4
  - TASK-7
references:
  - https://facelessuser.github.io/pymdown-extensions/extensions/snippets/
documentation:
  - docs/konzept.md
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
- [ ] #1 URL includes are fetched only when the source's site config sets `url_download: true`; otherwise they are reported as a warning saying URL includes are disabled
- [ ] #2 Fetching honours a timeout and a maximum size, and a failed fetch is reported as a warning without failing the sync
- [ ] #3 A URL-included file may only include further URLs, as in pymdownx.snippets
- [ ] #4 Requests cannot reach addresses an operator has not allowed (decision on the mechanism recorded before implementation)
- [ ] #5 Unit tests cover a fetched include, the disabled case, a failed fetch and a local include inside a URL include
<!-- AC:END -->

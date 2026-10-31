---
id: TASK-193
title: Check that no font is loaded from Google or another third party
status: To Do
assignee: []
created_date: '2026-10-30 23:20'
labels: []
milestone: m-1
dependencies: []
priority: medium
type: task
ordinal: 255000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire runs as an internal tool: no page may request fonts (or anything else) from Google Fonts or another CDN. The app self-hosts IBM Plex as woff2 (`app/src/app.css`, `app/src/lib/assets/fonts/`). Check the app, the Storybook build and the handbook: Zensical, like Material for MkDocs, loads Google Fonts unless `font = false` is set in `zensical.toml`, which today does not set it. Verify by the network requests of real pages, not by reading code.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loading every app page, a Storybook story and the built handbook makes no request to `fonts.googleapis.com`, `fonts.gstatic.com` or any other third-party host; checked by network requests
- [ ] #2 Whatever loaded from outside is self-hosted or turned off, and `make handbook` still builds
- [ ] #3 `make lint`, `make test`, `make e2e` and `make handbook` pass
<!-- AC:END -->

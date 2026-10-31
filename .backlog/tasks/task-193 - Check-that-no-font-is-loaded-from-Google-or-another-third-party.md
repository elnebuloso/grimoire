---
id: TASK-193
title: Check that no font is loaded from Google or another third party
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 02:08'
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
- [x] #1 Loading every app page, a Storybook story and the built handbook makes no request to `fonts.googleapis.com`, `fonts.gstatic.com` or any other third-party host; checked by network requests
- [x] #2 Whatever loaded from outside is self-hosted or turned off, and `make handbook` still builds
- [x] #3 `make lint`, `make test`, `make e2e` and `make handbook` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the requests of real pages in Chromium (Playwright script in the uncommitted app/.agent/): every app page logged out and logged in, light and dark, a Storybook story with its manager, every page of the built handbook; list every request to a host other than localhost.
2. Turn off or self-host whatever loads from outside.
3. Run the script again, then make lint, make test, make e2e, make handbook.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Before: the app (/, /login, /sources, a 404, every /manage page, /manage/sources/1 with preview, /account, the start page query, light and dark) and Storybook (manager and iframe of choicefield--checkbox under make storybook) made no request to another host. Every handbook page loaded fonts.googleapis.com (Inter, JetBrains Mono) and two woff2 files from fonts.gstatic.com: 21 requests over 7 pages. Zensical 0.0.70 (base.html) loads them unless theme.font is false. After font = false in zensical.toml: no request to another host on any of these pages; the handbook falls back to the theme's system font stack. make lint, make test (728), make e2e (21), make handbook pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
No page loads anything from a third party anymore. Checked by the network requests of real pages in Chromium: the app and Storybook already loaded nothing from outside; the handbook loaded Inter and JetBrains Mono from Google Fonts on every page. zensical.toml now sets font = false under [project.theme], so the handbook uses the theme's system fonts; afterwards no page requested another host. make lint, make test, make e2e and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->

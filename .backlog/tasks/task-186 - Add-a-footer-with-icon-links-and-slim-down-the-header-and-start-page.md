---
id: TASK-186
title: Add a footer with icon links and slim down the header and start page
status: To Do
assignee: []
created_date: '2026-10-30 21:34'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 248000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the user:
- A footer on every page (in `app/src/routes/+layout.svelte`) with two icon links: the GitHub repository of grimoire (`https://github.com/elnebuloso/grimoire`) and the documentation on GitHub Pages (`https://elnebuloso.github.io/grimoire/`).
- The start page drops its `h1` "grimoire" and the "grimoire on GitHub" link below it (`app/src/routes/+page.svelte`, the `.hero` block); the footer takes over the GitHub link.
- The "Manage" link in the header looks like the "Log out" button (raised control), while staying a link.

Points to settle while doing it:
- `docs/design.md` is binding and says "There are no pills, icons or emoji" and lists "icons or emoji" under "Not part of this design". It gets an exception for these two footer links first (size, colour token, hover, both schemes), before the code.
- Icons as inline SVG in the markup, no icon dependency. Each link has an accessible name from a message in every `app/messages/<locale>.json` (e.g. "grimoire on GitHub", "Documentation"), so screen readers and axe see text.
- Since TASK-183 the start page document title comes from its `PageHead title="grimoire"`. Without the heading the start page still needs a title and a top-level heading for screen readers; decide which (e.g. `Sources` as `h1`) and keep the `document-title` axe check green.
- `m.start_github_link` becomes unused unless the footer reuses it.
- TASK-185 (instance name) lists the start page heading and the GitHub link; whichever lands second adapts to the other.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page, the error page included, has a footer with an icon link to the GitHub repository and one to the documentation, each with an accessible name in the page language
- [ ] #2 `docs/design.md` allows exactly these footer icons and says how they look in light and dark
- [ ] #3 The start page shows no "grimoire" heading and no GitHub link above the sources, still has one `h1` and the document title "grimoire"
- [ ] #4 The "Manage" link in the header looks like the "Log out" button in both schemes and at `pointer: coarse` sizes, and is still a link
- [ ] #5 axe passes on the start page, a management page and the error page in light and dark, and nothing overflows at 390 px
- [ ] #6 Unused messages are removed from every message file
- [ ] #7 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

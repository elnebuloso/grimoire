---
id: TASK-186
title: Add a footer with icon links and slim down the header and start page
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 21:34'
updated_date: '2026-10-30 22:07'
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

Decided with the user:
- Icons are allowed. `docs/DESIGN.md` drops "There are no pills, icons or emoji" and "icons or emoji" under "Not part of this design", and says how icons look (size, `currentColor` from the existing tokens, hover, both schemes); the word still carries the meaning of a status.
- Icon library: `@lucide/svelte`, one import per icon (`import BookOpen from '@lucide/svelte/icons/book-open'`), pinned to an exact version at least two weeks old (`npm view @lucide/svelte time`). Not `@iconify/tailwind4` or `@unocss/preset-icons`: grimoire uses neither Tailwind nor UnoCSS.
- Lucide has no brand icons, so no GitHub logo: the GitHub link uses the official GitHub mark ("mark-github") as one inline SVG with `currentColor`, matching the Lucide icons in size.

Points to settle while doing it:
- Each icon link has an accessible name from a message in every `app/messages/<locale>.json` (e.g. "grimoire on GitHub", "Documentation"); the SVGs are `aria-hidden`.
- Since TASK-183 the start page document title comes from its `PageHead title="grimoire"`. Without the heading the start page still needs a title and a top-level heading for screen readers; decide which (e.g. `Sources` as `h1`) and keep the `document-title` axe check green.
- `m.start_github_link` becomes unused unless the footer reuses it.
- TASK-185 (instance name) lists the start page heading and the GitHub link; whichever lands second adapts to the other.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every page, the error page included, has a footer with an icon link to the GitHub repository and one to the documentation, each with an accessible name in the page language
- [ ] #2 The start page shows no "grimoire" heading and no GitHub link above the sources, still has one `h1` and the document title "grimoire"
- [ ] #3 The "Manage" link in the header looks like the "Log out" button in both schemes and at `pointer: coarse` sizes, and is still a link
- [ ] #4 axe passes on the start page, a management page and the error page in light and dark, and nothing overflows at 390 px
- [ ] #5 Unused messages are removed from every message file
- [ ] #6 `make lint`, `make test` and `make e2e` pass
- [ ] #7 `docs/DESIGN.md` allows icons and says how they look in light and dark; `@lucide/svelte` is pinned to an exact version at least two weeks old and only imported per icon
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. DESIGN.md: icons allowed (status still a word), Footer, Icons, Manage as raised control, start page without canvas title
2. @lucide/svelte 1.57.0 (2026-10-14) pinned; BookOpen per-icon import; GitHub mark inline SVG
3. Footer in +layout.svelte, a.button in app.css for Manage
4. Start page: hero removed, Sources heading becomes h1 at h2 size, own <title>grimoire</title>
5. Fix pre-existing axe landmark-unique (sources section and its table region shared the name)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- start_github_link renamed to footer_github and reused as the GitHub link name; new footer_docs, sources_table.
- The start page sets <svelte:head><title>grimoire</title> itself: it has no PageHead any more.
- Footer rule sits on an inner .links element so it is as wide as the sheets; mobile padding follows main.
- landmark-unique on / and /manage existed before (checked with the changes stashed): the Sources section and the table region inside were both named Sources; the region is now 'Table of sources'.
- Checked by hand: axe clean on /, /manage, a source page and the error page in light and dark; no overflow at 390 and 1366; footer hover accent.
<!-- SECTION:NOTES:END -->

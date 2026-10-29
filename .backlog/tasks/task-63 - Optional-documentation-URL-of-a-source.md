---
id: TASK-63
title: Optional documentation URL of a source
status: To Do
assignee: []
created_date: '2026-10-29 21:28'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A source holds the Markdown from Git, but its documentation is usually also published somewhere as a rendered site, e.g. built with MkDocs or Zensical. In the admin area there is no way to get from a source to that site; the admin has to know or look up its address. The admin wants to enter it once per source as a human-readable URL and open it from grimoire.

The URL is optional and stored as entered; grimoire does not derive URLs of single pages from it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The source form in the admin area and the source step of the project wizard have an optional field for the documentation URL; it works without JavaScript
- [ ] #2 Only an absolute `https://` or `http://` URL is accepted; anything else is rejected with a message, and an empty field stores no URL
- [ ] #3 When a source has a documentation URL, its page and the source list of its project show it as a link that opens the site; without one, no link is shown
- [ ] #4 Existing sources have no documentation URL after the migration and behave as before
- [ ] #5 Tests cover storing, changing and clearing the URL, the rejection of an invalid one, and the link shown only when a URL exists
- [ ] #6 The field is described in `docs/handbook/admin.md`
<!-- AC:END -->

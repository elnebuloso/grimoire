---
id: TASK-63
title: Optional documentation URL of a source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 21:28'
updated_date: '2026-10-29 22:03'
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
- [x] #1 The source form in the admin area and the source step of the project wizard have an optional field for the documentation URL; it works without JavaScript
- [x] #2 Only an absolute `https://` or `http://` URL is accepted; anything else is rejected with a message, and an empty field stores no URL
- [x] #3 When a source has a documentation URL, its page and the source list of its project show it as a link that opens the site; without one, no link is shown
- [x] #4 Existing sources have no documentation URL after the migration and behave as before
- [x] #5 Tests cover storing, changing and clearing the URL, the rejection of an invalid one, and the link shown only when a URL exists
- [x] #6 The field is described in `docs/handbook/admin.md`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0009-source-docs-url.sql adds sources.docs_url (TEXT, NULL = none).
2. app/src/lib/server/admin/projects.ts: docsUrl in SourceSettings and SourceForm, read and written by findSource/listSources and saveSource; sourceProblem checks it like checkGitUrl: empty is fine, otherwise an absolute https:// or http:// URL without credentials (the value ends up in href, so javascript: and relative values must not pass).
3. Optional field after the Git URL on the source page and in the wizard's source step (hidden in the other steps, a line in the summary); plain form POST, no JavaScript.
4. When set, a link with rel="external" on the source page and in the project's source list.
5. Messages en/de; a row in the source field table of docs/handbook/admin.md.
6. Tests: projects.spec.ts (store, change, clear, invalid values), route and wizard specs, admin.e2e.ts for the link shown only with a URL.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Beyond the criteria: a documentation URL with user:password@ is rejected too, because the link would show it to everyone in the admin area; javascript: and relative values fail the protocol check, which matters because the value goes into href. Links carry rel="external", which svelte/no-navigation-without-resolve accepts for links leaving the app.
Verified: make lint, make test (416), make e2e (15, a new test for the link shown only once the URL is set and never on the public start page), make handbook. Agent environment with a browser without JavaScript: javascript:alert(1) rejected with the message and the entered value kept; a URL on platform/docs shows the link on its page and in the project's source list, the other source shows none; clearing the field removes both links.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A source has an optional documentation URL (sources.docs_url, migration 0009; existing sources get none). The source form and the wizard's source step have the field, the summary shows it, and it works without JavaScript. Only absolute https:// or http:// URLs without credentials are accepted; an empty field stores none. When set, the source page and the project's source list link to it with rel="external"; the public start page and agents do not see it. Covered by unit, route, wizard and e2e tests and checked by hand; described in docs/handbook/admin.md.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-97
title: Translated error page
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:42'
labels: []
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
There is no `app/src/routes/+error.svelte`, so a 404 or 500 shows SvelteKit's default text, in English and outside the rule that every text is a message.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Not found and unexpected errors show a page with a translated message and a link to the start page
- [x] #2 The page shows no internal details of an unexpected error
- [x] #3 All texts are messages in every `app/messages/<locale>.json`
- [x] #4 A test checks the not-found page
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/src/routes/+error.svelte: a heading by status (not found, forbidden, anything else as unexpected), never page.error.message, and a link to the start page; inside the root layout, so header and language switch stay.
2. Messages in en.json and de.json.
3. e2e: an unknown path shows the translated not-found page with status 404 and the link.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
app/src/routes/+error.svelte renders inside the root layout (header and language switch stay); title by status 404 / 403 / anything else, and it never renders page.error.message, so an unexpected error shows only the generic sentence. Agent HTTP routes answer with their own Markdown Responses and are unaffected (agent-api.spec passes). Verified: new e2e 'answers an unknown path with a not-found page in the language of the browser' (status 404, German heading, link to /), make lint, make e2e 17 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A 404, 403 or unexpected error now shows a translated page with a link to the start page, inside the normal layout, instead of SvelteKit's English default; details of an unexpected error are never shown. Verified with a new e2e test, make lint and make e2e.
<!-- SECTION:FINAL_SUMMARY:END -->

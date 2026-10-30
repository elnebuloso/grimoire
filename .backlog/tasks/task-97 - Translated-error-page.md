---
id: TASK-97
title: Translated error page
status: To Do
assignee: []
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:02'
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
- [ ] #1 Not found and unexpected errors show a page with a translated message and a link to the start page
- [ ] #2 The page shows no internal details of an unexpected error
- [ ] #3 All texts are messages in every `app/messages/<locale>.json`
- [ ] #4 A test checks the not-found page
<!-- AC:END -->

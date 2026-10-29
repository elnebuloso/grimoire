---
id: TASK-49
title: Switch the UI language between German and English
status: To Do
assignee: []
created_date: '2026-10-29T06:46:00Z'
updated_date: '2026-10-29T06:58:00Z'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - .claude/rules/svelte-kit.md
priority: medium
type: feature
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want to use the UI in their own language: German and English to start with, more languages later, so adding one must not mean touching every page. The language is not part of the URL, so links and bookmarks stay the same whatever language the reader uses.

Decided with the user: translations use Paraglide, set up with the Svelte CLI add-on (`npx sv add paraglide`, see `.claude/rules/svelte-kit.md`). Not checked yet whether the add-on supports SvelteKit 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every text of the UI (start page, login, setup and admin area) is available in German and English
- [ ] #2 Without an active choice, the UI uses the language the browser asks for (`Accept-Language`), and English when it asks for none of the supported ones
- [ ] #3 A language the user picked actively is kept across pages and visits and takes precedence over the browser language
- [ ] #4 Every page offers a way to switch the language that works without JavaScript
- [ ] #5 URLs carry no language: no prefix, no query parameter, and the same URL serves both languages
- [ ] #6 Adding a language means adding its translations and registering it, without changes to pages or components
- [ ] #7 Tests cover choosing the language from the browser, the active choice taking precedence, and the fallback
<!-- AC:END -->

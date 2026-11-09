---
id: TASK-49
title: Switch the UI language between German and English
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T06:46:00Z'
updated_date: '2026-10-29 19:18'
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
- [x] #1 Every text of the UI (start page, login, setup and admin area) is available in German and English
- [x] #2 Without an active choice, the UI uses the language the browser asks for (`Accept-Language`), and English when it asks for none of the supported ones
- [x] #3 A language the user picked actively is kept across pages and visits and takes precedence over the browser language
- [x] #4 Every page offers a way to switch the language that works without JavaScript
- [x] #5 URLs carry no language: no prefix, no query parameter, and the same URL serves both languages
- [x] #6 Adding a language means adding its translations and registering it, without changes to pages or components
- [x] #7 Tests cover choosing the language from the browser, the active choice taking precedence, and the fallback
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Paraglide set up by the user with npx sv add paraglide; pin @inlang/paraglide-js 2.29.0 and load the message-format plugin 4.5.4 from node_modules instead of a CDN; drop the IDE-only m-function-matcher plugin.
2. Strategy cookie, then preferredLanguage (Accept-Language), then baseLocale en; no URL strategy, so the reroute hook and the hidden locale links of the add-on go.
3. Language switch in the header of every page: a form with one button per locale, named in its own language (Intl.DisplayNames), posting to a route that sets the cookie and leads back. Works without JavaScript.
4. Translate every text of pages, layout and components, and the form validation messages of the server. Sync errors and warnings stay English (decided with the user).
5. e2e tests: browser language, active choice beats the browser language, fallback to English.
6. Adding a language: messages/<locale>.json plus the locale in project.inlang/settings.json.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
sv add paraglide works with SvelteKit 3.

Changes to what the CLI generated:
- @inlang/paraglide-js pinned to 2.29.0. 2.29.3 was one day old.
- The message-format plugin 4.5.4 is an npm dependency and project.inlang/settings.json loads it from ./node_modules. The path is relative to the directory that holds project.inlang. Before, it was an unversioned jsdelivr URL fetched at build time.
- The IDE-only m-function-matcher plugin is dropped.
- The reroute hook and the hidden locale links (inline CSS) of the URL strategy are removed.
- package.json gains a paraglide script that compiles the messages. check runs it first, because the generated src/lib/paraglide does not exist before Vite runs, and CI lints before any build.
- inlang writes generated files into project.inlang/ and ignores them for git itself; .prettierignore now ignores them too.

auth.ts returns AuthProblem codes and routes translate them (auth-messages.ts): scripts/reset-admin.ts and agent-seed.ts load auth.ts with plain Node, and the Docker image copies that file alone. The guard tests now call the exported handleAdminAccess, because the composed handle needs SvelteKit's request store.

Verification:
- make lint, make test (323) and make e2e (14/14) pass. The three new e2e tests cover the browser language (de), the fallback (fr gives English), and an active choice that beats the browser language and holds on the next page.
- By hand with curl in the agent environment, without JavaScript:
  - the German start page for Accept-Language de
  - the German login error
  - the switch sets PARAGLIDE_LOCALE=en, and English wins over Accept-Language de
  - redirectTo //evil.example, /\evil.example and https://evil.example all lead to /
  - an unknown locale sets no cookie
- make agent-reset still loads auth.ts with plain Node.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The UI is available in English and German. A switch in the header of every page has one button per locale, named in its own language. It posts to /language, which stores the choice in the Paraglide cookie and leads back to the same page; this works without JavaScript and no URL carries a language. Without a choice, Accept-Language decides, with English as the fallback.

All page and component texts and the form validation messages are messages in app/messages/{en,de}.json. Sync errors and warnings stay English, as decided with the user. Adding a language takes a message file and an entry in project.inlang/settings.json; docs/components.md explains this, and the handbook describes the switch.

Paraglide is pinned and loads its plugin from node_modules, not a CDN. Tests: unit tests, three e2e tests for browser language, fallback and an active choice, and a manual check without JavaScript.
<!-- SECTION:FINAL_SUMMARY:END -->

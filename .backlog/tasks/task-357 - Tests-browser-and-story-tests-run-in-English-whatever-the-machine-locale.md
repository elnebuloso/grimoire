---
id: TASK-357
title: 'Tests: browser and story tests run in English whatever the machine locale'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:47'
updated_date: '2026-11-07 00:51'
labels: []
dependencies: []
references:
  - app/vite.config.ts
priority: medium
type: bug
ordinal: 419000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The vitest Playwright providers in `app/vite.config.ts` – `playwright()` of the `browser` project (around lines 45-52) and the light and dark instances of the `storybook` project (around lines 66-73; the dark one sets only `colorScheme`) – set no locale, so Chromium takes it from `LANG`/`LANGUAGE`. Paraglide's strategy `['cookie','preferredLanguage','baseLocale']` (`app/paraglide.config.ts`) then picks `de`, and every English accessible name the stories and browser specs look for stops matching. e2e is not affected: Playwright Test defaults `locale` to `en-US`.

Shown: `LANG=de_DE.UTF-8 LANGUAGE=de make test TEST="--project=storybook --project=browser"` – 48 of 79 files and 112 of 253 tests failed, e.g. `Unable to find an accessible element with the role "form" and name "Language"`. The dev machine and CI use `C.UTF-8`, so it never showed. A test must not depend on the machine's locale (`.claude/rules/agent-plugin-charter/base.md`).

Suggested fix: `contextOptions: { locale: 'en-US' }` on all three `playwright()` providers (the dark one `{ colorScheme: 'dark', locale: 'en-US' }`); check the option name of the installed `@vitest/browser-playwright` version.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `LANG=de_DE.UTF-8 LANGUAGE=de make test TEST="--project=storybook --project=browser"` passes
- [x] #2 The stories still run in both schemes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce: Preferences stories under LANG=de_DE.UTF-8 LANGUAGE=de fail on the English names
2. vite.config.ts: TEST_LOCALE = 'en-US' as contextOptions.locale on the browser provider and both storybook providers (dark keeps colorScheme)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Before: 6 of 6 Preferences stories failed under the German locale. After: `LANG=de_DE.UTF-8 LANGUAGE=de make test TEST="--project=storybook --project=browser"` passes 79 files, 253 tests, both schemes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The browser and Storybook tests now run Chromium with the locale en-US whatever the machine's language, so they no longer fail on a German desktop, where the app answered in German and the English names the tests look for did not match. Checked: the storybook and browser projects pass under LANG=de_DE.UTF-8 in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->

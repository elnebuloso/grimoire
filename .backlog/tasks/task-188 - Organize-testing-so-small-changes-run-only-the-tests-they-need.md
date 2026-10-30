---
id: TASK-188
title: Organize testing so small changes run only the tests they need
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 22:27'
updated_date: '2026-10-30 22:45'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: task
ordinal: 250000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the user: for small changes the agent almost always runs the full e2e suite, which costs a production build and about a minute each time.

Today:
- `make test`: unit and server specs (vitest project `server`) plus every Storybook story in headless Chromium (project `storybook`), about 45 s; `make e2e`: production build, fresh database, mail catcher, all Playwright tests (`app/src/routes/language.e2e.ts`, `theme.e2e.ts`, `manage/manage.e2e.ts`, which runs serially and builds on its own state), about 45–60 s plus the build; `make lint`: prettier, eslint, svelte-check.
- The agent environment (`make agent-start`, `.claude/rules/agent-environment.md`) already serves code changes without a restart.

Work out a test strategy that picks the cheapest check that can catch the failure of a given change, e.g.:
- which change needs which suite (a message text, a component style, a server module, a route, the hooks, a migration, a dependency), and when the full run is due (before a commit that ships, at the end of a batch of tasks)
- running single spec files or vitest projects (`npx vitest run --project server <file>`), single stories, single Playwright files or tests (`--grep`) and whether `manage.e2e.ts` can be run partly despite its serial state
- whether Makefile targets for these narrower runs are worth adding (`.claude/rules/agent-plugin-charter/make.md`: a command needed twice becomes a target)
- what the agent environment and a curl or browser check cover instead of e2e

If optimizations are found, record them as `.claude/rules/testing-strategy.md`, written as rules for the agent like the other files there. Measure the durations quoted in it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Durations of `make lint`, `make test`, `make e2e` and of the narrower runs are measured, not estimated
- [x] #2 For each kind of change the narrowest check that catches its failures is named, with when the full suites are due
- [x] #3 If optimizations were found, `.claude/rules/testing-strategy.md` records them as rules, and any new Makefile targets are documented and phony
- [x] #4 Nothing is dropped from CI: the full suites still run there
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Measure make lint/test/e2e and narrow runs (single spec, story, project, --changed, single e2e file)
2. Make the narrow runs available through the existing targets (TEST=, E2E=)
3. Write .claude/rules/testing-strategy.md: cheapest run per kind of change, full suites before shipping
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Durations measured in the agent shell (4 cores): make lint 62 s, make test 91 s (server 39 s, sync.spec.ts alone 38 s; storybook 21 s), make e2e 65 s (build 10 s), one spec 8-9 s, one story file 13-15 s, one e2e file 17-19 s, make format 6 s.
- vitest --changed selects through the import graph: a component change ran 1 story file (16 s), src/lib/slug.ts ran 11 files (44 s).
- Found: theme.e2e.ts depended on manage.e2e.ts having created the admin (visited /login, which redirects to /setup before); passed only by worker timing. Fixed to use the not-found page.
- manage.e2e.ts is serial and cannot be run in parts.
- No new Makefile targets: make test and make e2e take TEST= and E2E= instead. CI unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Testing strategy recorded in .claude/rules/testing-strategy.md: measured costs of every run, the cheapest run per kind of change (default make test TEST=--changed, single spec/story/e2e file, agent environment for pages and looks), the changes that need the full suites, and full lint/test/e2e before the commit that ships. make test and make e2e take TEST= and E2E= to narrow a run. Fixed theme.e2e.ts, which only passed when manage.e2e.ts had run first. CI still runs everything. Verified: make lint, make e2e (23).
<!-- SECTION:FINAL_SUMMARY:END -->

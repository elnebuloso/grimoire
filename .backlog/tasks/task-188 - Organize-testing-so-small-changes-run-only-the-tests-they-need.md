---
id: TASK-188
title: Organize testing so small changes run only the tests they need
status: To Do
assignee: []
created_date: '2026-10-30 22:27'
labels: []
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
- [ ] #1 Durations of `make lint`, `make test`, `make e2e` and of the narrower runs are measured, not estimated
- [ ] #2 For each kind of change the narrowest check that catches its failures is named, with when the full suites are due
- [ ] #3 If optimizations were found, `.claude/rules/testing-strategy.md` records them as rules, and any new Makefile targets are documented and phony
- [ ] #4 Nothing is dropped from CI: the full suites still run there
<!-- AC:END -->

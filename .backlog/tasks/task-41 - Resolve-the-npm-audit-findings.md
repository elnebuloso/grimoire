---
id: TASK-41
title: Resolve the npm audit findings
status: To Do
assignee: []
created_date: '2026-10-29T00:47:00Z'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: chore
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`npm audit` in `app/` reports moderate findings in `vitest` and `@vitest/mocker` and low findings in `@sveltejs/kit`, `@sveltejs/adapter-node` and `@sveltejs/vite-plugin-svelte` (via `deepmerge`). Kit and adapter-node ship in the image. Updates follow the dependency rule: at least two weeks old and pinned, except security fixes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each finding is fixed by an update or judged not to affect grimoire, with the reason recorded
- [ ] #2 `make lint`, `make test` and `make e2e` pass after the updates
<!-- AC:END -->

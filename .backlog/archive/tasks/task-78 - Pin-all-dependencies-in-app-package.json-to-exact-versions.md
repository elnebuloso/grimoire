---
id: TASK-78
title: Pin all dependencies in app/package.json to exact versions
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:45'
labels:
  - ops
milestone: m-0
dependencies: []
references:
  - app/package.json
priority: medium
type: chore
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

`.claude/rules/memory.md` requires exact versions (and `.claude/rules/svelte-kit.md` repeats it for what the CLI adds), but `app/package.json` has 24 `^` ranges, among them runtime dependencies (`remark-parse`, `unified`, `yaml`, `remark-gfm`, `unist-util-visit`) and `@sveltejs/kit` and `@sveltejs/adapter-node`. The lockfile keeps builds reproducible today, but the next `npm install <x>` or lockfile refresh can move any of them past the two-week age check the rule exists for.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every dependency in `app/package.json` is an exact version equal to the one in `app/package-lock.json`
- [x] #2 `npm ci`, `make test` and `make build` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace every range in app/package.json with the version app/package-lock.json resolves, then refresh only the lockfile's root specifiers with npm install --package-lock-only.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
24 ranges pinned (7 dependencies, 17 devDependencies); the lockfile diff touches only the 24 root specifiers, no resolved version changed. npm ci, make lint, make test (478 passed) and make build pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every dependency in app/package.json is now pinned to the exact version already in app/package-lock.json, as the dependency rule asks. No resolved version changed. Verified with npm ci, make lint, make test and make build.
<!-- SECTION:FINAL_SUMMARY:END -->

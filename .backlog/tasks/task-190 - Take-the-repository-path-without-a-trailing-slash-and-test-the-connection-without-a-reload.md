---
id: TASK-190
title: >-
  Take the repository path without a trailing slash and test the connection
  without a reload
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:10'
updated_date: '2026-10-30 23:19'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: enhancement
ordinal: 252000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the user on `/manage/sources/new`:
- "Path in the repository" defaults to `docs/`, which suggests the trailing slash is required. It is not: validation only rejects a leading `/` and `..`, and sync strips a trailing slash. Default `docs`; a trailing slash is removed on save, so `docs` and `docs/` are the same path and do not trigger a re-index. Stored values stay as they are.
- "Test connection" posts the whole form to `?/test` and reloads the page. It should answer in place, keeping what was typed and the scroll position, and mark a reachable repository with a green check (Lucide `circle-check`, `--ok`) beside the text; the word stays, as `docs/DESIGN.md` requires. Without JavaScript it works as today.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new source starts with the path `docs`; the handbook names `docs` as example
- [x] #2 Saving `docs/` stores `docs`; changing only a trailing slash does not re-index
- [x] #3 Test connection answers without a page load, keeps the entered values and shows a green check beside the reachable message; errors show as before
- [x] #4 Without JavaScript the test still works by form post
- [x] #5 Tests cover the path normalization and the in-place connection test
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. repositoryPath() drops a trailing slash on save and in the re-index comparison; default docs; handbook examples
2. use:enhance on the source form: test without invalidation or reset, button busy while pending, token input cleared after every answer (only the sealed copy stays)
3. Green circle-check (--ok) beside the reachable message
4. sources.spec for normalization, e2e for in-place test
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Saving also goes through enhance now: a redirect becomes a client navigation, a rejected save keeps the typed values (no reset) as before.
- Checked by hand in the agent environment: no reload, scroll position kept, token field empty with the entered label, check icon in light and dark; plain form post (curl) still answers with the message.
- Existing stored paths such as docs/ stay as they are.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The repository path defaults to docs and loses a trailing slash on save, so docs and docs/ are one path and no longer re-index. Test connection answers in place (use:enhance), keeps the entered values and scroll position, shows a green check beside the reachable message, and still keeps an entered token only encrypted; without JavaScript it works as before. Verified: sources.spec, e2e (in-place, check icon, default path), hand checks; make lint, make test (700), make e2e (23).
<!-- SECTION:FINAL_SUMMARY:END -->

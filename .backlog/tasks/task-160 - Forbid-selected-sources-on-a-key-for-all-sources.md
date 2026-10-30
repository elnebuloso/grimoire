---
id: TASK-160
title: Forbid selected sources on a key for all sources
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 15:32'
updated_date: '2026-10-30 15:43'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: chore
ordinal: 222000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A key for all sources (`api_keys.all_sources = 1`) can still have rows in `api_key_sources`; the code ignores them, but the stored state is ambiguous and a reader of the database cannot tell which one applies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The database refuses a row in `api_key_sources` for a key with `all_sources = 1`, and switching a key with rows to `all_sources = 1`
- [x] #2 Creating and changing keys in both directions (all ↔ selection) keeps working
- [x] #3 Tests cover both refusals
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Two triggers refuse a row in `api_key_sources` for a key with `all_sources = 1` and switching a key that still has rows to `all_sources = 1`. `updateApiKey` now deletes the old selection before updating the key. Verified: tests for both refusals and for switching all → selection and selection → all; `make lint` clean, `make test` 621/621.
<!-- SECTION:FINAL_SUMMARY:END -->

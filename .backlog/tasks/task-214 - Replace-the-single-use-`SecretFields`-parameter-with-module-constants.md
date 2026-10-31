---
id: TASK-214
title: Replace the single-use `SecretFields` parameter with module constants
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:19'
labels:
  - admin
milestone: m-1
dependencies: []
priority: low
type: chore
ordinal: 276000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/admin/form-secret.ts` (~lines 3-20) defines the interface `SecretFields` (`entered`, `sealed`, `discard`, `remove`) so the field names of a form secret can vary, but its only value is `SOURCE_TOKEN_FIELDS`. The project allows an abstraction only once a second use exists; until then, readers have to go through an extra layer to find four field names.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The source token field names are plain constants in `form-secret.ts`, and the `SecretFields` interface is gone
- [x] #2 Source form tests that carry, discard and remove the token still pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. form-secret.ts: replace SecretFields and SOURCE_TOKEN_FIELDS with four field-name constants; readFormSecret(data, key) reads them.
2. Update the source page action and form-secret.spec.ts; run the form-secret and route specs.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
form-secret.ts holds the four field names of the source token as module constants; the SecretFields interface and SOURCE_TOKEN_FIELDS are gone and readFormSecret(data, key) reads the constants. Source page action and form-secret.spec.ts updated; form-secret and route specs pass (28 tests), including carry, discard and remove.
<!-- SECTION:FINAL_SUMMARY:END -->

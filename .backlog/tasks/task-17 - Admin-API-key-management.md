---
id: TASK-17
title: 'Admin: API key management'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-11
  - TASK-14
documentation:
  - docs/concept.md
priority: medium
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Agents need API keys, created and revoked by the admin. Only the hash is stored, so the key can be shown only once.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A key can be created with a name and a scope (all projects or a selection)
- [x] #2 The plain key is shown exactly once after creation
- [x] #3 Keys are listed with name and scope, without the key
- [x] #4 A key can be revoked and stops working immediately
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. /admin/api-keys: list (name, scope, created) from listApiKeys; create form (name, scope all or selected projects as checkboxes) via createApiKey, the plain key only in the action result; revoke action via revokeApiKey. Link from /admin.
2. Tests: route spec (validation, key returned once and absent from load data, revoke ends scopeForKey); e2e: create a key for one project, call /projects with it, revoke, get 401.
3. Remove make api-key and scripts/create-api-key.ts, update README; handbook admin.md section on API keys.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
app/src/lib/server/api-keys.ts already had create/list/revoke from TASK-12; this task adds the page /admin/api-keys. The plain key exists only in the result of the create action; load data never carries it.
Removed make api-key and scripts/create-api-key.ts; README and handbook point to the admin area.
Verified: make test 239 passed, make lint clean, make e2e twice 5 passed: a key for one project answers /projects with that project only; after revoking, the same request gets 401.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
API keys are managed under /admin/api-keys: create with a name and all projects or a selection, the key shown once after creation, list with name, scope and creation time, revoke with immediate effect. make api-key and its script are gone. Handbook: admin.md 'API keys'.
<!-- SECTION:FINAL_SUMMARY:END -->

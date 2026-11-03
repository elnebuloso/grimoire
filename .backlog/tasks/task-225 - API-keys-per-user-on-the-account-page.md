---
id: TASK-225
title: API keys per user on the account page
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:30'
updated_date: '2026-11-03 00:58'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-223
references:
  - app/src/routes/manage/api-keys/
  - app/src/routes/account/
priority: high
type: feature
ordinal: 287000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every user is to create keys for their own tools without waiting for an admin; the admin keeps an overview and can stop a leaked key. Keys otherwise behave as today: name, all sources or a selection, optional expiry, last use.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every user creates, edits and revokes any number of their own keys on `/account`
- [x] #2 A key covers all sources or a selection, chosen from the sources its owner may read
- [x] #3 Admins list every key under `/manage/api-keys` with name, owner and last use, and can revoke any key; only the owner edits one
- [x] #4 A user never sees or changes another user's keys
- [x] #5 Route specs cover owner, other user and admin
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the key page from /manage/api-keys to /account/api-keys (git mv), scoped to the logged-in user: own keys, sources from readableSlugs.
2. api-keys.ts: listApiKeys(db, ownerId?) with owner email; updateApiKey and revokeApiKey limited to the owner; selections refused when they name another user's private source.
3. New admin-only /manage/api-keys: table of every key with owner, sources, last use and Revoke.
4. Nav: My API keys for everyone, All API keys for admins; start page connect text points to My API keys.
5. Specs, e2e manage flow, look at the page in light and dark.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The own key page lives at /account/api-keys, under the account pages every logged-in user may open.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Each user manages their own keys at /account/api-keys (moved from /manage/api-keys): only their keys are listed, the source choice is what they may read, and update/revoke touch only their own keys (404/no-op otherwise). /manage/api-keys is now an admin-only table of every key with owner, sources and last use, where any key can be revoked. Tests: api-keys.spec (owner filter, foreign key not changed or revoked, foreign private source refused), account/api-keys spec (other user's keys invisible and untouched), manage/api-keys spec (list with owner, revoke). make e2e for manage.e2e.ts: 16 passed; page checked in light and dark.
<!-- SECTION:FINAL_SUMMARY:END -->

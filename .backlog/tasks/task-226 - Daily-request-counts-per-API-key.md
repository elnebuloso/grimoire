---
id: TASK-226
title: Daily request counts per API key
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:30'
updated_date: '2026-11-03 01:03'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-225
priority: medium
type: feature
ordinal: 288000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Last use alone does not show how much a key is used. For audits, owners and admins want to see the requests per day (for example 100 on day 1, 1000 on day 2), to spot an abused or forgotten key. It counts requests, not what was read.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Requests are counted per key and calendar day in the time zone of the instance
- [x] #2 Counts are written batched like `last_used_at`, not with every request
- [x] #3 Days older than 90 days are removed; the counts of a revoked key go with it
- [x] #4 The owner on `/account` and admins under `/manage/api-keys` see the counts per day
- [x] #5 Tests cover counting, the day boundary and the 90-day removal with a pinned clock
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0003: api_key_requests (key, day, requests), cascading with the key.
2. scopeForKey counts each accepted request in memory per key and day and writes the counts together with last_used_at (once a minute per key); writing removes days older than 90.
3. listApiKeys returns written plus unwritten counts per day, latest first; revoking drops unwritten counts.
4. RequestsPerDay component (stories: several days, none) on /account/api-keys and /manage/api-keys.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Counts not yet written live in memory per database connection; the lists add them, so the display is exact while the server runs. A restart loses at most the last minute of a key's counts (marked as shortcut in api-keys.ts).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Requests are counted per key and calendar day of the instance (new table api_key_requests, migration 0003). Counting happens in memory and is written with last_used_at at most once a minute per key, so a burst does not write per request; each write removes days older than 90, and a revoked key's counts go with it (cascade). Owners see their counts on /account/api-keys, admins per key on /manage/api-keys, through the new RequestsPerDay component (stories with axe). Tests in api-keys.spec with a pinned clock: batched writes, day boundary, 90-day removal, revoked key, rejected keys not counted. Checked in the agent environment: 3 requests with the user key show on My API keys.
<!-- SECTION:FINAL_SUMMARY:END -->

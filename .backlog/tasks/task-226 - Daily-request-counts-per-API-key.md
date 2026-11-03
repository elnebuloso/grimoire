---
id: TASK-226
title: Daily request counts per API key
status: To Do
assignee: []
created_date: '2026-11-03 00:30'
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
- [ ] #1 Requests are counted per key and calendar day in the time zone of the instance
- [ ] #2 Counts are written batched like `last_used_at`, not with every request
- [ ] #3 Days older than 90 days are removed; the counts of a revoked key go with it
- [ ] #4 The owner on `/account` and admins under `/manage/api-keys` see the counts per day
- [ ] #5 Tests cover counting, the day boundary and the 90-day removal with a pinned clock
<!-- AC:END -->

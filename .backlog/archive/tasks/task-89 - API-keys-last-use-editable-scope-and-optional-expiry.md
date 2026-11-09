---
id: TASK-89
title: 'API keys: last use, editable scope and optional expiry'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:00'
updated_date: '2026-10-30 02:20'
labels:
  - admin
  - agent-api
milestone: m-0
dependencies: []
references:
  - app/src/routes/manage/api-keys/+page.svelte
priority: medium
type: feature
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The key list shows only name, scope and creation date. Nobody can tell which keys are still in use and which can be revoked, changing the projects a key sees means revoking it and handing out a new one to every agent that uses it, and a key handed out for a trial stays valid forever.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every key records when it was last used to authenticate a request, and the list shows it ("never" for unused keys)
- [x] #2 Recording the last use does not write to the database on every request (at most once per key per minute, or a similar bound)
- [x] #3 The scope of an existing key (all projects or a selection) can be changed without changing the key itself
- [x] #4 A key can get an optional expiry date; an expired key is rejected like an unknown one and shown as expired in the list
- [x] #5 Tests cover last-use recording, scope change and expiry
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Migration 0014: api_keys.last_used_at (ISO instant) and api_keys.valid_until (YYYY-MM-DD, NULL = no expiry).
2. api-keys.ts: createApiKey takes validUntil; updateApiKey changes scope and validUntil without touching the hash (shared scope writing); scopeForKey takes { now, today }, rejects a key whose valid_until is before today, and writes last_used_at only when it is null or at least 60 s old, so a burst of requests writes once.
3. time-zone.ts: dateIn(timeZone, instant) gives the calendar date in the instance time zone; http.ts passes today in TZ.
4. API keys page: each key shows last use (or never), valid until / expired; a <details> per key with the scope fields and the date to change them; create form gains the optional date. Scope fields written once as a snippet. Dates before today are rejected.
5. Tests: api-keys.spec (last use throttle with pinned clock, expiry boundary, update keeps key), api-keys route spec (update action, validation), time-zone.spec (dateIn); e2e API key test still passes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Migration 0014 adds api_keys.last_used_at and api_keys.valid_until (YYYY-MM-DD, CHECK on the format). scopeForKey takes a Clock { now, today }; http.ts passes today in TZ via dateIn (time-zone.ts), because api-keys.ts must keep importing only node: modules for scripts/agent-seed.ts. Last use is decided in JS, not in an UPDATE's WHERE, so a request within the minute takes no write lock. Expiry semantics: valid through valid_until, rejected from the next day on. The change form sits in a <details> per key and shares the scope and date fields with the create form through a snippet. Verified: api-keys.spec (throttle at 59 s/60 s, expiry boundary, update keeps key, rollback on unknown project), route spec (update action, date validation, expired flag with pinned system time), time-zone.spec (dateIn across zones, formatDate), make lint, make test 522 passed, make e2e 16 passed; by hand in the agent environment: last use shown after two requests, scope change to billing reflected by /projects, an expired key answers 401 and is listed as expired.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
API keys now record their last use (at most one write per key per minute) and can carry an optional 'valid until' date, after which they are rejected like unknown keys and shown as expired. Scope and date of an existing key can be changed from the list without replacing the key. Handbook admin.md documents all three. Verified with unit tests, make lint, make test, make e2e and by hand in the agent environment.
<!-- SECTION:FINAL_SUMMARY:END -->

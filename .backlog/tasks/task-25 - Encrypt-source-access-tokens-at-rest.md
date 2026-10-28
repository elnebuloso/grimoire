---
id: TASK-25
title: Encrypt source access tokens at rest
status: To Do
assignee: []
created_date: '2026-10-28T20:23:00Z'
updated_date: '2026-10-28T20:29:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-2
  - TASK-26
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every source stores the read token of its Git provider in `sources.token` (`app/src/lib/server/db/schema.ts`). Git needs the token in clear text, so it cannot be hashed like API keys. Stored in plain text, anyone who gets hold of the SQLite file or a backup of the volume can read every connected repository. The concept requires that tokens never leave grimoire; the database file is the one place where that is not yet true.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tokens are stored encrypted with authenticated encryption; the database file alone does not reveal them
- [ ] #2 The key comes from an environment variable that is required when the server starts
- [ ] #3 A wrong or missing key gives a clear error that names the variable and never prints the key or a token
- [ ] #4 The sync decrypts the token only to run git; the clear value is never stored, logged or returned by the API
- [ ] #5 Unit tests cover the round trip, a wrong key and a tampered value
<!-- AC:END -->

---
id: TASK-206
title: Merge the two identical SHA-256 helpers
status: To Do
assignee: []
created_date: '2026-10-31 01:36'
updated_date: '2026-10-31 01:37'
labels:
  - admin
dependencies: []
references:
  - app/src/lib/server/admin/auth.ts
  - app/src/lib/server/api-keys.ts
priority: low
type: chore
ordinal: 268000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`sha256()` in `app/src/lib/server/admin/auth.ts` (hashes session and password-reset tokens) and `hashKey()` in `app/src/lib/server/api-keys.ts` (hashes API keys) are the same code: `createHash('sha256').update(value).digest('hex')`. Two copies of security-relevant hashing can drift apart unnoticed.

Keep the reasoning comment of `hashKey` (a random 256-bit key needs no slow hash). Both files are loaded by plain Node from `scripts/reset-admin.ts` and `scripts/agent-seed.ts`, so imports keep their `.ts` extension and use nothing Vite resolves.

Found in the code audit of 2026-10-31.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One SHA-256 helper exists, used for sessions, password resets and API keys
- [ ] #2 Stored hashes stay identical, so existing sessions, reset links and API keys keep working
- [ ] #3 `scripts/reset-admin.ts` and `scripts/agent-seed.ts` still run with plain Node
<!-- AC:END -->

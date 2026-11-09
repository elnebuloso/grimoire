---
id: TASK-206
title: Merge the two identical SHA-256 helpers
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 01:36'
updated_date: '2026-10-31 02:01'
labels:
  - admin
milestone: m-1
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
- [x] #1 One SHA-256 helper exists, used for sessions, password resets and API keys
- [x] #2 Stored hashes stay identical, so existing sessions, reset links and API keys keep working
- [x] #3 `scripts/reset-admin.ts` and `scripts/agent-seed.ts` still run with plain Node
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep sha256 in app/src/lib/server/admin/auth.ts (sessions, password resets); api-keys.ts imports it and hashKey goes.
2. The reasoning comment of hashKey moves to the key constants in api-keys.ts.
3. scripts/agent-seed.ts takes sha256 from auth.ts, which it already imports.
4. Check: tests reached by the change, agent-reset (plain Node) and a request with the seeded key, reset-admin.ts loads.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
make test --changed green (90 tests). make agent-reset ran scripts/agent-seed.ts with plain Node, and GET /sources with the seeded key grimoire_agent-fixture-key answered the source list, so the stored key hash is unchanged. reset-admin.ts without a terminal stops at its question after all imports loaded.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One SHA-256 helper is left: sha256 in admin/auth.ts, now also used for API keys in api-keys.ts and by scripts/agent-seed.ts; hashKey is gone. The why of a fast hash for keys stays as a comment at the key constants. The hash is the same function, so existing sessions, reset links and API keys keep working (checked with the seeded agent key). Both scripts still run with plain Node.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-340
title: 'Encryption: require the full AES-GCM tag length when decrypting'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:06'
updated_date: '2026-11-06 22:42'
labels:
  - ops
dependencies: []
references:
  - app/src/lib/server/secret-encryption.ts
priority: low
type: bug
ordinal: 402000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`decryptSecret` in `app/src/lib/server/secret-encryption.ts` (around lines 55-62) calls `createDecipheriv` without `authTagLength`. It decrypts source tokens, form secrets and the OIDC flow and link cookies. A stored value of 12 + 4 bytes passes a 4-byte tag to `setAuthTag`, which Node 24 accepts with a DEP0182 deprecation warning: a forged value then passes with probability 2^-32 instead of 2^-128. Only an empty plaintext is reachable that way and every caller rejects it (JSON.parse fails), so there is no exploit today, but any visitor can trigger the deprecation warning with a crafted cookie.

Suggested fix: `createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })`.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A value with a tag shorter than 16 bytes is refused like any other invalid value
- [x] #2 Values encrypted by `encryptSecret` still decrypt, existing stored values included
- [x] #3 A spec in `secret-encryption.spec.ts` covers a short tag
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: a value of IV and a valid 4-byte tag (empty plaintext) is refused
2. decryptSecret passes authTagLength: TAG_BYTES to createDecipheriv
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before (the forged value decrypted to an empty string) and passes after; secret-encryption, OIDC, form-secret and import specs pass (79 tests), so stored values and the export fixture still decrypt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decryption now requires the full 16-byte AES-GCM authentication tag: a value with a shorter tag, which Node accepted with a deprecation warning and checked with only 2^-32 strength, is refused like any other invalid value. Values encrypted by encryptSecret still decrypt. Covered by a spec with a forged short-tag value.
<!-- SECTION:FINAL_SUMMARY:END -->

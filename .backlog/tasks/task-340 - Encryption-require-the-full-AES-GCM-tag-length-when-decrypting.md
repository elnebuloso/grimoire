---
id: TASK-340
title: 'Encryption: require the full AES-GCM tag length when decrypting'
status: To Do
assignee: []
created_date: '2026-11-06 22:06'
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
- [ ] #1 A value with a tag shorter than 16 bytes is refused like any other invalid value
- [ ] #2 Values encrypted by `encryptSecret` still decrypt, existing stored values included
- [ ] #3 A spec in `secret-encryption.spec.ts` covers a short tag
<!-- AC:END -->

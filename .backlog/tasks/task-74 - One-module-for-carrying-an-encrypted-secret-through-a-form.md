---
id: TASK-74
title: One module for carrying an encrypted secret through a form
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - app/src/lib/server/token-encryption.ts
priority: medium
type: bug
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

The browser round trip of a source token (the form carries it as a hidden `encryptedToken` and the server decrypts whatever comes back) is implemented twice:
- `readSourceForm` in `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts:69-102`
- `readValues`, `withToken` and `sourceForm` in `app/src/routes/manage/projects/new/+page.server.ts:30-62`

They already differ: the source page re-encrypts on every request, the wizard keeps the old ciphertext; the removal flag means "remove stored" on one and "drop carried" on the other. `decryptToken` throws on a tampered value (`app/src/lib/server/token-encryption.ts:33-46`) and neither route catches it, so a changed hidden field becomes an unexpected 500. The ciphertext is not bound to anything and stays valid as long as the key does.

The UI rule "share the parts when the wholes differ" (`.claude/rules/ui-components.md`) is followed in the markup but not on the server. The next form with a secret (SSH key, webhook secret) would get a third copy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Both routes seal and open the carried secret through one shared server module
- [ ] #2 A tampered or foreign hidden value answers 400 with a form error instead of a 500
- [ ] #3 The meaning of the remove flag is the same on both forms
- [ ] #4 Tests cover sealing, opening and tampered input
<!-- AC:END -->

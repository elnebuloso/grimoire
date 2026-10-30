---
id: TASK-74
title: One module for carrying an encrypted secret through a form
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
updated_date: '2026-10-30 00:32'
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
- [x] #1 Both routes seal and open the carried secret through one shared server module
- [x] #2 A tampered or foreign hidden value answers 400 with a form error instead of a 500
- [x] #3 The meaning of the remove flag is the same on both forms
- [x] #4 Tests cover sealing, opening and tampered input
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module app/src/lib/server/admin/form-secret.ts: readFormSecret(data, key, fields) returns value, sealed, remove and damaged; SOURCE_TOKEN_FIELDS names the fields both forms use.
2. Source page readSourceForm and wizard readInput read the token through it; a damaged value answers 400 with error_token_damaged (en, de) and the values without the token.
3. Unit tests for the module, route tests for a tampered value on both forms.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Unified remove semantics: a newly entered token wins; otherwise the remove checkbox drops the carried token on both forms (on the source page it also removes the stored one, as before). Previously the source page kept a carried token when remove was checked, and saved it.

Wizard: create now runs firstProblem as well, so a damaged token is caught there too; createProjectWithSource validated the same anyway.

Not done (not in the ACs): binding the ciphertext to the form or a time limit; a carried value stays valid as long as the key. Checked in the agent environment: test action with encryptedToken=tampered answers 400 with the message, nothing in the server log.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The browser round trip of a source token now goes through one module, app/src/lib/server/admin/form-secret.ts, on the source page and in the project wizard. A tampered or foreign hidden value now answers 400 with "enter it again" (en, de) instead of an unexpected 500. The remove checkbox means the same on both forms. Verified by unit tests for the module, route tests for both forms (they fail on the old routes), a curl check in the agent environment, make lint and make test (476 passed). Not covered: carried ciphertext is still not bound to a form or expiry.
<!-- SECTION:FINAL_SUMMARY:END -->

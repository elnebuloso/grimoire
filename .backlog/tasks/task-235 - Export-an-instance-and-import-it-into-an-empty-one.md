---
id: TASK-235
title: Export an instance and import it into an empty one
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 13:35'
updated_date: '2026-11-05 13:50'
labels:
  - admin
dependencies: []
priority: medium
type: feature
ordinal: 297000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A backup copy of the database restores the same instance, or one started with the same instance key: stored access tokens decrypt only under the key that encrypted them (ADR 0006). Moving the state to an instance with its own key, or giving an instance a new key, has no path; every token would have to be entered again. Whoever moves an instance may have a browser and no shell on the target. The owner confirmed the rules on 2026-11-05; they go into ADR 0009.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An admin exports the instance under Manage > Settings with a passphrase of at least 12 characters entered twice; the file is encrypted whole (scrypt, AES-256-GCM) with only a header naming format, version and derivation parameters readable
- [x] #2 The export carries sources with their access tokens, owners and visibility, users with roles and password hashes, API keys with owners and source selections, and the settings; index, sessions, invitations, password resets, sync history, missed queries and key request counts stay behind
- [x] #3 Access tokens travel decrypted inside the file and are encrypted under the target key on import; a token that cannot be decrypted stops the export and names its sources
- [x] #4 An import runs the migrations on the exported database, so earlier exports stay importable; an export of a newer version and a wrong passphrase or damaged file are refused with their own message
- [x] #5 An import goes only into an instance without users and sources: by `scripts/import.ts` in the container, or on the setup page behind the setup token; the imported users then log in with their accounts
- [x] #6 The import reports the imported sources whose Git host this instance refuses
- [x] #7 Every column of an exported table is listed as exported or runtime; a column in neither list fails a spec
- [x] #8 A fixture export of this version stays importable by a spec; e2e exports on one instance and imports on a second, empty one; the image smoke runs the import script
- [x] #9 ADR 0009 records the decision; the handbook has a page "Moving an instance", including changing ENCRYPTION_KEY
- [x] #10 `make test`, `make e2e`, `make lint`, `make image-smoke` and `make handbook` pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ported from the archived commits (git apply with rejects) and fitted to this schema: no linked identities, password_hash NOT NULL, sessions with three columns, no missed_query_sources. checkSetupToken split out of setupAdmin in admin/auth.ts; the setup page has the actions create and import; the login page shows the imported notice. New against the archive at that time: refusedSources in connection-policy.ts, used by the start check, the import script and the setup import (log warning). Fixture export-schema-4.grimoire-export written once with writeExport at schema 4 (passphrase "fixture passphrase 2026"), used by instance-import.spec.ts, setup/import.spec.ts and the image smoke. e2e: second instance on port 4174 (serverEnv shared). Handbook: moving.md (in nav), database.md points to it. Verified: make test 924/924 (88 files), make e2e 25/25, make lint clean, make image-smoke "import script: ok", make handbook --strict; the settings export section looked at in light and dark. Not looked at in a browser: the setup page with the import form (covered by e2e).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An admin exports the whole instance under Manage > Settings as one file encrypted with a passphrase (scrypt, AES-256-GCM); access tokens travel decrypted inside and are encrypted under the target key on import. The content is the database at its schema version, migrated on import; only an empty instance takes an import, on the setup page behind the setup token or with scripts/import.ts. The import names sources whose Git host the target refuses. Every column of an exported table is listed as exported or runtime, enforced by a spec; a fixture export of schema 4 stays importable. ADR 0009 (accepted) and the handbook page "Moving an instance" document it. Verified with make test, make e2e (second instance on port 4174), make lint, make image-smoke and make handbook.
<!-- SECTION:FINAL_SUMMARY:END -->

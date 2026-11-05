---
id: TASK-247
title: 'Replace reset-admin with grant-admin: make an existing account an admin'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 19:01'
updated_date: '2026-11-05 19:13'
labels:
  - admin
dependencies: []
priority: medium
type: feature
ordinal: 309000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When no admin can log in any more, `scripts/reset-admin.ts` deletes the admin account with its sessions and linked identities and reopens `/setup`. Since 1.8.0 an admin may log in only through an OIDC provider and have no password, so deleting the account loses more than it fixes. The owner decided on 2026-11-05 to replace it with `scripts/grant-admin.ts`, which deletes nobody. This also makes 5046aba (reset by foreign keys) obsolete, as `resetAdmin` goes away.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `node scripts/grant-admin.ts <EMAIL_ADDRESS>` gives the admin role to the existing account with that address; other admins and accounts stay unchanged
- [x] #2 An address without an account aborts with `No account has that email address; nothing was changed.`; no account is created
- [x] #3 An account that already is an admin is reported as such, without an error
- [x] #4 With `--password` the script asks for the password twice in a terminal, requires `MIN_PASSWORD_LENGTH` characters, ends every session of the account and voids its password reset links; without `--password` it needs no terminal and changes no password or session
- [x] #5 `scripts/reset-admin.ts`, `resetAdmin` and the log line `Admin account was reset.` are gone; the image, `scripts/image-smoke.sh`, the `Makefile` target (now `admin-grant`) and `docs/handbook/docker.md` describe grant-admin
- [x] #6 Specs cover granting, the unknown address, the existing admin and the password change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `grantAdmin(db, email, passwordHash?)` in `app/src/lib/server/admin/auth.ts` returns unknown / granted / already-admin; with a hash it sets the password, ends sessions, deletes reset links, in one transaction
2. Remove `resetAdmin` and the `adminSeen` reset log line; setup keeps handing ownerless keys to the first admin (keys predating owners)
3. `scripts/grant-admin.ts` from 1377c04 without the admin order; `scripts/reset-admin.ts` removed
4. Dockerfile, `image-smoke.sh`, Makefile target `admin-grant`, handbook `docker.md`, `memory.md` example
5. Specs in `auth.spec.ts` for grantAdmin and the script; run auth.spec, then lint/test/e2e before the commit
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Foreign keys are enforced by default in node:sqlite (PRAGMA foreign_keys = 1, checked on Node 24.22.1), so the old reset never left rows behind; with resetAdmin gone, 5046aba is moot. Setup still hands keys without owner to the first admin (keys predating owners). The --password path was tried by hand in a pseudo terminal (script -qec): too short refused, valid password set, sessions ended. The handbook row in moving.md that mentioned an admin reset was trimmed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`scripts/grant-admin.ts <EMAIL_ADDRESS> [--password]` replaces `scripts/reset-admin.ts`: it gives an existing account the role admin, reports an existing admin, refuses an unknown address, and with `--password` (terminal only, 12 characters) sets the password and ends sessions and reset links. `resetAdmin` and the `Admin account was reset.` log line are gone; Dockerfile, `image-smoke.sh`, `make admin-grant`, handbook (`docker.md` "Lost admin access", links in `admin.md`, `moving.md`) and `memory.md` follow. Verified: make lint, make test (985 passed), make e2e (28 passed), make image and make image-smoke (grant-admin script: ok). Operators who scripted reset-admin.ts must switch.
<!-- SECTION:FINAL_SUMMARY:END -->

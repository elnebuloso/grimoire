---
id: TASK-7
title: Git sync of a source
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-2
  - TASK-4
  - TASK-5
  - TASK-6
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Git is the source of truth; grimoire only reads. A sync brings one source (repo, branch, one path) into the index. It speaks only Git, no provider API, so every Git server works the same. Agents must never see a half-written index, and a failed sync must not wipe what worked before. Access tokens are secrets and must never leak.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `git ls-remote` is used to detect changes; an unchanged commit skips the sync
- [x] #2 The source path is fetched with a shallow sparse clone into a temporary directory that is always removed afterwards
- [x] #3 Include targets outside the path are fetched via `sparse-checkout add` of their directory until no new targets appear
- [x] #4 All pages, snippets and links of the source are replaced in one transaction
- [x] #5 A failed sync keeps the last good state active and stores the error on the source
- [x] #6 A file that cannot be processed is skipped and stored as a warning; the rest is indexed
- [x] #7 Exclusion patterns of the source are applied
- [x] #8 The access token never appears in errors, warnings, logs or stored URLs
- [x] #9 Integration test syncs a local test repository
- [x] #10 Link records produced by link resolution are stored with the pages and snippets of the source
- [x] #11 The sync decrypts the token only to run git; the clear value is never stored, logged or returned by the API
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/sync/git.ts`: run git via `execFile` with `GIT_TERMINAL_PROMPT=0` and a timeout. Credentials go in as `GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0` = `http.<url>.extraHeader: Authorization: Basic base64(user:token)` – never in the URL, the arguments or `.git/config`, and only sent to that URL. Every git error is redacted (token, header value, credentials embedded in a URL). Functions: `remoteCommit` (`ls-remote`), `sparseClone` (`clone --depth 1 --filter=blob:none --sparse` + `sparse-checkout set`, whole repo when the path is the root), `addSparseDirectories`, `headCommit`.
2. `sync/index-source.ts`: from a checkout, list the `.md` files under the source path minus exclusions (`path.matchesGlob`, patterns relative to the repo root), resolve includes in rounds – fetching directories of targets outside the path until none are new –, then `preprocessPage`, `chunkPage`, `resolveLinks`. A page that throws is skipped with a warning; include warnings come from the last round.
3. `db/sources.ts` (all SQL stays in `db/`): `sourceForSync`, `replaceSourceIndex` (one `BEGIN IMMEDIATE` transaction: delete pages, insert pages, snippets + `snippets_fts` with code blocks split from text, links; set `last_commit`, `last_synced_at`, warnings, clear error), `recordSyncError`.
4. `sync/sync.ts`: `syncSource(db, sourceId, { key, force })` – decrypt token, `ls-remote`, skip when unchanged unless `force`, clone into a `mkdtemp` directory removed in `finally`, index, write; any failure is stored as the source error and leaves the index untouched. `last_commit` is the cloned HEAD.
5. Tests: unit tests for credential env and redaction, code/text split; integration test with a local bare repo over `file://` (needs `uploadpack.allowFilter`): first sync, unchanged skip, include outside the path, exclusion, broken page, failed sync keeps state, token absent from stored error.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-4: run `resolveIncludes(raw, { path, sourcePath }, read)` (`app/src/lib/server/parsing/include.ts`) on every page before `preprocessPage`; `read` takes repo-relative paths and returns undefined for missing files. Collect `outsideSourcePath` over all pages, `git sparse-checkout add` the directories not yet checked out, rerun until nothing new appears; keep only the warnings of the last run.

Handoff from TASK-6: after chunking every page of the source, call `resolveLinks(pages, { project, source })` (`app/src/lib/server/parsing/links.ts`) with the pages keyed by file relative to the source path; store its `pages` (snippet text with rewritten links) and its `links` (`{ file, anchor, target, dead }`; `target` is the link as written when it leaves the source path).

Handoff from TASK-2: open the database with `database()` (`app/src/lib/server/db/index.ts`). Writing a snippet means two inserts: the `snippets` row, then `snippets_fts` with `rowid` = snippet id and the text split into `text` and `code`. Deleting the source's pages cascades to snippets, links and (by trigger) FTS rows. JSON columns: `sources.exclusions`, `sources.warnings`, `pages.tags`, `snippets.aliases`, `snippets.title_path`.

Handoff from TASK-25: `sources.encrypted_token` holds the token encrypted; decrypt it with `decryptToken(stored, TOKEN_ENCRYPTION_KEY)` (`app/src/lib/server/token-encryption.ts`, key from `$app/env/private`) right before running git. A decryption error is a sync error of the source; its message is safe to store.

Checked by a probe against a local bare repository: after `sparseClone` only the source directory is checked out, `addSparseDirectories` adds exactly the requested one, `remote.origin.partialclonefilter` is `blob:none`, history depth is 1.

Unverified: that GitLab, GitHub, Forgejo and Gitea all accept the token as HTTP Basic auth (`username:token`) in `http.<url>.extraHeader` over HTTPS. Only `file://` was tested here; check against a real provider before release.

Credentials typed into the Git URL itself (`https://user:token@…`) are stripped from every error, but the URL is stored as entered; the admin form (TASK-15) should reject such URLs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the sync of one source: `syncSource(db, sourceId, { key, force, workDirectory })` in `app/src/lib/server/sync/sync.ts`. It decrypts the token, asks `git ls-remote` for the branch head and returns `unchanged` (clearing an old error) when it matches `last_commit`; otherwise it makes a shallow, blob-less sparse clone of the source path into a `mkdtemp` directory removed in `finally`, indexes it and replaces pages, snippets, FTS entries and links in one transaction (`replaceSourceIndex` in `db/sources.ts`, where all SQL lives). `indexCheckout` (`sync/index-source.ts`) lists `.md` files minus exclusions (`path.matchesGlob`, repo-relative), resolves includes in rounds fetching outside directories with `sparse-checkout add`, then preprocesses, chunks and resolves links; a page that throws is skipped with a warning. Any failure is stored redacted on the source and the previous index stays. Git gets the token only through the child process environment as an `http.<url>.extraHeader` scoped to the remote, never in arguments, URL or `.git/config`; errors are redacted and carry no `cause`. Verified: integration tests against a local bare repo over `file://` (first sync with include outside the path, exclusion, broken page, links; unchanged skip; new commit replaces the index; failed sync keeps the index; token absent from stored error; wrong key), unit tests for credentials and redaction (89 tests in total), `make lint`. Open: Basic auth with real providers is untested.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-2
title: Database schema
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:31:00Z'
updated_date: '2026-10-28T20:21:00Z'
labels:
  - search
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All data lives in one SQLite file: projects, their sources, the pages and snippets read from Git, links between pages, and API keys. Snippets are searched with FTS5 BM25 weighted per column (title path strong, text normal, code weak), so the index needs those columns separately. IDs are `<project>/<source>/<file without .md>#<anchor>`, so the source slug must be unique within its project.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The SQLite file path is configurable via an environment variable; the schema is created on first start
- [x] #2 Tables exist for projects, sources, pages, snippets, links and API keys as described in the data model of `docs/konzept.md`
- [x] #3 Snippets are indexed in an FTS5 table with separate columns for title path, text and code
- [x] #4 A second source with the same slug in the same project is rejected by the database; the same slug in another project is allowed
- [x] #5 Deleting a source removes its pages, snippets and links
- [x] #6 Backlinks of a page can be queried from the links table
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `app/src/lib/server/db/schema.ts`: `openDatabase(path)` opens the file, enables foreign keys and creates the schema when `PRAGMA user_version` is 0.
2. Tables: `projects`, `sources` (unique `project_id, slug`), `pages`, `snippets` (with `position`; no unique key on page/anchor, since split parts share an anchor), `links` (indexed by `target`), `api_keys` plus `api_key_projects` for keys limited to some projects. Everything below a source cascades on delete.
3. `snippets_fts`: FTS5 table with columns `title_path`, `text`, `code`, rowid = snippet id; a trigger removes the FTS row when its snippet is deleted, since cascades do not reach virtual tables.
4. `findBacklinks(db, pageId)` returns the snippet IDs linking to a page or one of its anchors.
5. `app/src/lib/server/db/index.ts`: `database()` opens the file named by `DATABASE_PATH` once.
6. Tests with `:memory:` for every AC; `make build` to check the bundler handles `node:sqlite`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-5: parts of a split section (`Heading (1/2)`, `(2/2)`) share the same anchor, and the overview snippet has none – (page, anchor) is not a unique key for snippets.

AC "Backlinks of a page can be queried" moved here from TASK-6, which only produces the link records (decided with the user).

Decided with the user: built-in `node:sqlite` with plain SQL, no ORM, no native module. Measured on Node 24.21 (SQLite 3.53): FTS5 and weighted `bm25()` work.

SvelteKit 3 replaced `$env/*` and `$lib`: variables are declared in `app/src/env.ts` with `defineEnvVars` and imported from `$app/env/private`; the alias is `#lib`; `ServerInit` comes from `@sveltejs/kit/hooks`.

Source access tokens are stored in plain text in `sources.token`; git needs them in clear, and encryption at rest was not part of this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Schema in `app/src/lib/server/db/schema.ts` on built-in `node:sqlite` (decided with the user), plain SQL, `STRICT` tables, WAL. `openDatabase(path)` enables foreign keys and creates the schema when `PRAGMA user_version` is 0. Tables: `projects`, `sources` (unique per project and slug), `pages`, `snippets` (ordered by `position`), `links` (indexed by `target`), `api_keys`, `api_key_projects`; everything below a source cascades on delete. `snippets_fts` is an FTS5 table with `title_path`, `text`, `code`, rowid = snippet id; a trigger deletes its rows with their snippet. `findBacklinks(db, pageId)` in `db/links.ts`. `DATABASE_PATH` is declared in `app/src/env.ts`, required at server start but not at build; `app/src/hooks.server.ts` opens the database in `init`, so the schema exists after the first start. `make dev` defaults it to `app/grimoire.db` (git-ignored). Verified: 7 tests in `db/schema.spec.ts` (61 in total), `make lint`, `make build`; the built server refuses to start without `DATABASE_PATH` and creates the schema with it; `make dev` creates the file on the first request. Follow-up candidate: encrypting `sources.token` at rest.
<!-- SECTION:FINAL_SUMMARY:END -->

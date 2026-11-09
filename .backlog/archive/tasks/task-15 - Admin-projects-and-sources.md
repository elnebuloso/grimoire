---
id: TASK-15
title: 'Admin: projects and sources'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:34:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-2
  - TASK-14
documentation:
  - docs/concept.md
priority: high
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Projects group sources; a source is one Git repo with branch and exactly one path. Several paths of a repo are separate sources. Access tokens are secrets: they can be set but never read back.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Projects can be created, edited and deleted (slug, short description)
- [x] #2 Sources can be created, edited and deleted (slug, HTTPS Git URL, branch, path, exclusions, user, token)
- [x] #3 Slugs are validated; a duplicate source slug within a project is shown as an error
- [x] #4 The token is write-only: never rendered, editing a source without entering a token keeps the old one
- [x] #5 Git URLs are always shown without credentials
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/src/lib/server/admin/projects.ts: list/get/save/delete for projects and sources with validation (slug ^[a-z0-9]+(-[a-z0-9]+)*$, HTTPS URL without credentials, path without absolute or .. segments, exclusions one glob per line, schedule via parseSchedule). Duplicate slugs become form errors. Token encrypted with encryptToken; empty keeps the old one, a checkbox removes it; the view model only carries hasToken. URLs shown through redactUrl.
2. Routes by id, so a slug rename keeps the URL: /admin (project list), /admin/projects/[id] (id or 'new'; edit, delete, source list), /admin/projects/[id]/sources/[sourceId] (sourceId or 'new'; edit, delete, next scheduled check).
3. Saving a source requests a forced sync (requestSync(id, { force: true })), so changed path/exclusions take effect without a new commit.
4. Tests: projects.spec.ts for validation and token handling; admin.spec.ts for the actions (fail 400 with values, redirects, token never in page data).
5. make lint, make test, manual check against the built server; handbook page for operators if one covers the admin area.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-25: store a source token with `encryptToken(token, TOKEN_ENCRYPTION_KEY)` in `sources.encrypted_token`; never send the stored or clear value back to the browser.

Handoff from TASK-7: reject Git URLs with embedded credentials (`https://user:token@…`); username and token have their own fields.

Handoff from TASK-28: sources have an optional `sync_schedule` (cron, five fields). Validate it with `parseSchedule` (`app/src/lib/server/sync/schedule.ts`) before saving; empty means the global `SYNC_SCHEDULE`. Showing the next run (croner `nextRun()`) helps operators read the expression.

Routes go by id (/admin/projects/[id], /admin/projects/[id]/sources/[sourceId], 'new' for the create form), so renaming a slug keeps the URL. Validation and storage live in app/src/lib/server/admin/projects.ts.
A stored token is not carried to another Git server: changing the URL's origin requires entering the token again or removing it. A failed form sends the Git URL back through redactUrl.
Verified: make test (227 passed, 34 new), make lint; built server driven with curl (PROTOCOL_HEADER=x-forwarded-proto): setup, project create, duplicate slug 400, source create with token, URL with credentials 400; /admin, project and source pages contain no token; the forced sync indexed docs/handbook of this repository (3 pages).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Admin pages to create, edit and delete projects and sources. Slugs, HTTPS Git URLs without credentials, relative paths and cron schedules are validated; duplicates come back as form errors with the entered values. The access token is write-only: stored encrypted, shown only as stored/none, kept when left empty, removable by checkbox, and asked for again when the URL moves to another server. Saving a source requests a forced sync. Handbook: docs/handbook/admin.md, section 'Projects and sources'. Follow-ups already planned: TASK-34 (Playwright), TASK-16 (status and sync now).
<!-- SECTION:FINAL_SUMMARY:END -->

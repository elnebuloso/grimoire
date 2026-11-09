---
id: TASK-216
title: Keep a typed Git token when another form on the source page is submitted
status: Done
assignee:
  - '@claude'
created_date: '2026-10-31 13:06'
updated_date: '2026-10-31 13:30'
labels:
  - admin
milestone: m-1
dependencies: []
priority: low
type: bug
ordinal: 278000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On `app/src/routes/manage/sources/[id]/+page.svelte`, a token typed into the settings form travels between requests encrypted in a hidden field (`encryptedToken`, see `app/src/lib/server/admin/form-secret.ts`). Only the enhanced settings form sends that field back. If the admin submits another form on the same page with a full-page submit (for example **Sync now**) before saving, the sealed token is lost and has to be typed again. No stored data is lost.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A token entered and tested but not yet saved is still there after **Sync now** on the source page; the slug change form, a rare and deliberate step, may still reload the page
- [x] #2 A story or e2e test covers it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Enhance the Sync now form so its redirect only reloads the page data (invalidateAll) instead of navigating: the settings form, its form result and the sealed token stay. Other results go through update().
2. e2e step in manage.e2e.ts after the sync test: enter a token, test the connection, Sync now; the token stays entered and never shows in the page.
3. The slug change form still posts a full page; noted, not part of this change.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Sync now form enhanced: on its redirect only invalidateAll() runs, so the settings form, the form result and the sealed token stay; other results go through update(). New e2e step 'keeps a tested token that is not saved yet when syncing now' in manage.e2e.ts fails without the change (label 'Access token (entered; ...)' not found) and passes with it; the whole manage.e2e.ts passes (16 tests). Open: the slug change form (SlugChangeForm, full-page POST to ?/slug) still drops a tested token, so AC #1 holds for Sync now only. Waiting for the user to decide whether the slug form is in scope.

Scope narrowed by the user to Sync now: the slug change form keeps its full-page POST; a tested token is retyped in that rare case.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Sync now form is enhanced: on its redirect only invalidateAll() runs, so the settings form, its result and the sealed token stay instead of being dropped by a page reload. e2e step 'keeps a tested token that is not saved yet when syncing now' in manage.e2e.ts fails without the change and passes with it; full lint, test and e2e passed. By the user's decision the slug change form keeps its full-page POST and still drops a tested, unsaved token.
<!-- SECTION:FINAL_SUMMARY:END -->

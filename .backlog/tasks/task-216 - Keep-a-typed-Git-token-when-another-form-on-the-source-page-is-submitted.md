---
id: TASK-216
title: Keep a typed Git token when another form on the source page is submitted
status: To Do
assignee: []
created_date: '2026-10-31 13:06'
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
- [ ] #1 A token entered but not yet saved is still there after another form on the source page has been submitted, or that form cannot be submitted while unsaved token input is pending
- [ ] #2 A story or e2e test covers it
<!-- AC:END -->

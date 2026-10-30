---
id: TASK-163
title: Stop announcing a sync after a slug change
status: To Do
assignee: []
created_date: '2026-10-30 15:51'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 225000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After a slug change the source page says `Slug changed. The sync with the new IDs has started.` (`slug_changed`), and the explanation above the form ends with `The source is synced again.` (`slug_change_source_effects`). The `slug` action in `app/src/routes/manage/sources/[id]/+page.server.ts` starts no sync, and none is needed: IDs are built from the slug when the index is read, so the new IDs apply at once. The admin is told to wait for something that never happens.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Neither message announces a sync; both say the new IDs apply at once
- [ ] #2 Every language file is changed alike
- [ ] #3 A test checks the message shown after a slug change
<!-- AC:END -->

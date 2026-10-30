---
id: TASK-163
title: Stop announcing a sync after a slug change
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 15:51'
updated_date: '2026-10-30 16:34'
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
- [x] #1 Neither message announces a sync; both say the new IDs apply at once
- [x] #2 Every language file is changed alike
- [x] #3 A test checks the message shown after a slug change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `slug_changed` and `slug_change_source_effects` say the new IDs apply at once, in `en.json` and `de.json`
2. The "Changed" story of `SlugChangeForm` checks the full message
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
After a slug change the source page now says `Slug changed. The new IDs apply at once.`, and the explanation above the form ends with `The new IDs apply at once.` instead of announcing a sync that never runs; German alike. The "Changed" story of `SlugChangeForm` checks the full message. Verified: SlugChangeForm stories green in Chromium.
<!-- SECTION:FINAL_SUMMARY:END -->

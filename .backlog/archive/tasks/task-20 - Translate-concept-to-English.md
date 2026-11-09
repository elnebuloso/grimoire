---
id: TASK-20
title: Translate concept to English
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:35:00Z'
labels: []
milestone: m-0
dependencies: []
documentation:
  - docs/concept.md
priority: medium
type: docs
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire is planned as an open-source project; code, docs and admin area are in English. The concept is still German and must be translated at the latest before the first push to GitHub (open item 1 of the concept).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `docs/konzept.md` is translated to English without changing any decision
- [x] #2 The file name and links to it are updated consistently
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`docs/konzept.md` is now `docs/concept.md`, translated to English without changing any decision; German examples were translated with it (heading "Known issues" → anchor `known-issues`, admonition "Caution"). The open-items section was dropped, its only item was this translation; the status line now reads "agreed, version 1 functionally complete" (agreed with the user). The `docs` field of all 28 tasks and the descriptions of milestones `m-0` and `m-1` point to the new file (milestones edited directly with the user's consent, the CLI cannot change them). Text in notes of finished tasks still names `docs/konzept.md` as history.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-410
title: 'Source settings: mark required fields'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-09 09:45'
updated_date: '2026-11-09 09:48'
labels:
  - admin
dependencies: []
priority: low
type: enhancement
ordinal: 472000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The source settings form (`/manage/sources/<id>/settings`, `/manage/sources/new`) does not show which fields are required (Name, Git URL, Branch). Mark them with an asterisk and add a legend at the top of the form. Only `SourceSettingsForm.svelte`; the shared field components stay unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Required fields of the source settings show an asterisk after their label, hidden from screen readers
- [x] #2 A legend at the top of the form explains the asterisk, in en and de
- [x] #3 The story of `SourceSettingsForm` checks the legend and which fields are required
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. CSS rule in SourceSettingsForm.svelte: label:has(:required) > span::after { content: ' *' / '' }
2. Legend message source_required_legend (en, de) as muted paragraph at the top of the form
3. Extend the SourceSettingsForm story play function
4. Check in the agent environment, light and dark
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source settings form marks Name, Git URL and Branch with an asterisk and explains it in a legend at the top (`source_required_legend`, en/de). The asterisk is a CSS rule on `label:has(:required) > span` in `SourceSettingsForm.svelte` with empty alternative text, so accessible names stay unchanged and screen readers rely on `required`; shared field components are untouched. Verified: `SourceSettingsForm.stories.svelte` (incl. axe) passes; checked in the agent environment in light and dark.
<!-- SECTION:FINAL_SUMMARY:END -->

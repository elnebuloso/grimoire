---
id: TASK-343
title: 'Headings: custom IDs like attr_list (non-ASCII, dots, space before the brace)'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:06'
updated_date: '2026-11-06 22:43'
labels:
  - parsing
dependencies: []
references:
  - app/src/lib/server/parsing/chunk.ts
priority: low
type: bug
ordinal: 405000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`app/src/lib/server/parsing/chunk.ts` (around lines 149-162) takes a trailing `{#id}` off a heading as its custom ID with `/#([\w-]+)/`. Compared with Python-Markdown's attr_list:
1. `\w` is ASCII-only: `## Über uns {#über}` gives `uber-uns` (no custom ID found); Python-Markdown gives `über`. `{#v1.2}` gives `v1`.
2. attr_list needs whitespace before `{`: `## Map{key}` gives grimoire `map`; Python-Markdown keeps the text and gives `mapkey`.
Wrong anchors make links count as dead and differ from the published site.

Suggested fix: `/#([^\s}]+)/` for the ID, and treat `{…}` as attributes only when whitespace precedes the `{`.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `{#über}` and `{#v1.2}` become the anchors `über` and `v1.2`
- [x] #2 A brace without whitespace before it is part of the heading text
- [x] #3 Specs in `chunk.spec.ts` cover both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec checked against Python-Markdown 3.7 (toc, attr_list): {#über} → über, {#v1.2} → v1.2, Map{key} → mapkey, {: #with-colon } → with-colon
2. takeAttributeListId requires a space before the brace and reads the id as [^\s}]+
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Expected ids produced with Python-Markdown in the audit's scratch venv. The spec failed before and passes after; parsing and index-pages specs pass (124 tests).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Custom heading ids are now read as attr_list reads them: any characters up to a space or the closing brace (`{#über}`, `{#v1.2}`), and only when a space precedes the brace, so `## Map{key}` keeps its text and gets the anchor mapkey. Expected ids checked against Python-Markdown 3.7; covered by a spec in chunk.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

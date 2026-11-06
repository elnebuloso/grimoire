---
id: TASK-343
title: 'Headings: custom IDs like attr_list (non-ASCII, dots, space before the brace)'
status: To Do
assignee: []
created_date: '2026-11-06 22:06'
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
- [ ] #1 `{#über}` and `{#v1.2}` become the anchors `über` and `v1.2`
- [ ] #2 A brace without whitespace before it is part of the heading text
- [ ] #3 Specs in `chunk.spec.ts` cover both
<!-- AC:END -->

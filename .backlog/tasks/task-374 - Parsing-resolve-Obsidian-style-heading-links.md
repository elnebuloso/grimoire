---
id: TASK-374
title: 'Parsing: resolve Obsidian-style heading links'
status: To Do
assignee: []
created_date: '2026-11-07 13:30'
labels:
  - parsing
dependencies: []
references:
  - app/benchmark/baseline/odoo-wiki-de.index.json
priority: low
type: spike
ordinal: 436000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea, not started. Documentation written in Obsidian links to a section by its heading text, not by its anchor: `[x](Settings E-Mail#E-Mail-Vorlagen%20anzeigen)`. grimoire reports these as dead links and does not follow them; the upstream build of such sites rewrites them. In the benchmark's `odoo-wiki-de` (Odoo Wiki, Zensical) 390 of 394 dead links are of this kind.

Questions to answer: how common is this outside one wiki (other Obsidian-based sites, `[[wikilinks]]` too); can a link's heading text be matched to the anchor grimoire builds for that heading without false matches; what changes for authors (dead-link list, IDs stay as they are). Measure with the benchmark's dead links before deciding.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 How common the link style is and how it would map to anchors is written down, with the effect on the benchmark's dead links
- [ ] #2 The owner decides whether to build it
<!-- AC:END -->

---
id: TASK-377
title: 'Agents: tell the language of each source'
status: To Do
assignee: []
created_date: '2026-11-07 13:32'
labels:
  - search
  - agent-api
dependencies: []
references:
  - app/src/lib/server/agent/operations.ts
  - app/src/lib/server/parsing/site-config.ts
priority: low
type: spike
ordinal: 439000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea, not started. grimoire stores no language per source: `sources` shows `- slug: description`, and the description is free text an admin writes. An agent learns a source's language only from the hits it gets, or from the `Not in any searched source:` line after a question in the wrong language (TASK-369, TASK-372), which costs a call. With the language in `sources`, e.g. `- billing-docs (de): …`, it could ask in the right language from the start.

Questions to answer: where the language comes from – `theme.language` in `mkdocs.yml` or `zensical.toml` where set (i-doit-de and odoo-wiki-de have it, Hugo and fastapi-de not), else detected at sync from the text (the share of English and German stopwords grimoire already keeps), else unknown; how a source with pages in several languages is shown; whether the start page or the management area should show it too; what it costs in tokens and in the agent instructions (250-token limit). The benchmark measures search, not agent behaviour: the benefit is argued, not measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Source of the language, the rule for mixed sources and the agent-visible format are written down, with how often each benchmark documentation is detected correctly
- [ ] #2 The owner decides whether to build it
<!-- AC:END -->

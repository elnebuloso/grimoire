---
id: TASK-155
title: 'Remove projects: sources are the only unit'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 14:51'
updated_date: '2026-10-30 15:08'
labels:
  - admin
  - agent-api
milestone: m-0
dependencies: []
priority: high
type: feature
ordinal: 217000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Projects group sources, but documentation rarely spans several paths of one repository, and agents search across everything by default. The grouping makes the admin area (project page, wizard), the IDs and the API key scopes more complex than they need to be, and it would make per-source visibility (public/private) much harder to configure. Several docs in one repository become several sources, each with its own name. This breaks the agent interface and IDs; it ships as `feat` with the break described in the commit body. Before 1.0 the schema is changed in place, without a migration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The `projects` and `api_key_projects` tables are gone; a source has `slug`, `name` and `description`, and its slug is unique across the instance
- [x] #2 Grimoire IDs are `source/page#anchor`; links between pages resolve with the new IDs
- [x] #3 Agent operations (MCP and HTTP) list sources with their description, index one source and query all or a given list of sources; no tool or route names a project
- [x] #4 API keys are scoped to all sources or a selection of sources
- [x] #5 Missed queries, dead links and stats refer to sources instead of projects
- [x] #6 The admin area manages sources on one form built from the existing field components; the project page and the project wizard are gone
- [x] #7 Agent instructions, handbook and `docs/concept.md` describe sources without projects; `make handbook` passes
- [x] #8 Tests and stories cover the changed behaviour; `make test` passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Schema: drop projects and api_key_projects; sources get a description and a globally unique slug; api_key_sources; missed_queries.sources
2. IDs source/page#anchor; agent operations, MCP tools and HTTP routes on sources (/sources, /sources/<source>, /sources/<source>/llms.txt, /query?source=…, /p/<source>/<page>)
3. API key scope by sources; admin: one source form at /manage/sources/[id], dashboard lists sources, project page and wizard removed
4. Adapt tests, seed, smoke script; update handbook, concept, README, agent instructions
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Projects are gone; sources are the only unit. A source has name, description and an instance-wide unique slug; IDs are `source/page#anchor`. Agent tools are `sources`, `index`, `query` (optional list `sources`) and `read`; HTTP routes are `/sources`, `/sources/<source>`, `/sources/<source>/llms.txt`, `/query?source=…` (repeatable) and `/p/<source>/<page>`. API keys are scoped to all or selected sources. The admin manages sources at `/manage/sources/[id]` (`new` to create); project page and wizard are removed. Handbook, concept, README, agent instructions and fixture seed updated (fixture slugs `platform-docs`, `billing-docs`, `billing-archive`, `platform-next`).

Verified: `make lint` clean, `make test` 60 files / 596 tests green, `make e2e` 18/18, `make handbook` strict; by hand in the agent environment: `/sources`, index, llms.txt, query over two sources, 404 for an unknown source, page read and MCP `query` with `sources`.

Breaks the agent interface and every stored ID and URL.
<!-- SECTION:FINAL_SUMMARY:END -->

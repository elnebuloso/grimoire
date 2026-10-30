---
id: TASK-155
title: 'Remove projects: sources are the only unit'
status: To Do
assignee: []
created_date: '2026-10-30 14:51'
labels:
  - admin
  - agent-api
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
- [ ] #1 The `projects` and `api_key_projects` tables are gone; a source has `slug`, `name` and `description`, and its slug is unique across the instance
- [ ] #2 Grimoire IDs are `source/page#anchor`; links between pages resolve with the new IDs
- [ ] #3 Agent operations (MCP and HTTP) list sources with their description, index one source and query all or a given list of sources; no tool or route names a project
- [ ] #4 API keys are scoped to all sources or a selection of sources
- [ ] #5 Missed queries, dead links and stats refer to sources instead of projects
- [ ] #6 The admin area manages sources on one form built from the existing field components; the project page and the project wizard are gone
- [ ] #7 Agent instructions, handbook and `docs/concept.md` describe sources without projects; `make handbook` passes
- [ ] #8 Tests and stories cover the changed behaviour; `make test` passes
<!-- AC:END -->

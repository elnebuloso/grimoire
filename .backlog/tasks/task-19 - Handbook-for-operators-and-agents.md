---
id: TASK-19
title: Handbook for operators and agents
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-29T00:41:00Z'
labels: []
milestone: m-0
dependencies:
  - TASK-18
documentation:
  - docs/concept.md
priority: medium
type: docs
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operators need to know how to run grimoire, and doc authors how to write docs that split into useful snippets. The handbook in `docs/handbook/` is published on its own one day.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A page explains running the Docker image and every environment variable
- [x] #2 A page explains connecting agents via MCP and via the `CLAUDE.md` snippet with `/instructions`
- [x] #3 A page explains the writing rules: one topic per file, every section understandable on its own
- [x] #4 Pages are in English and link only within the handbook
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-26: the handbook starts with `docs/handbook/database.md` (database configuration, schema updates, backups); link it from the operator pages.

`docs/handbook/database.md` also holds the sync schedule section by now; decide whether it becomes its own operator page.

Tested the Compose example with `elnebuloso/grimoire:0.5.0` and `caddy:2.11.7` (`caddy reverse-proxy --from :8080 --to grimoire:3000`): setup, login and the admin page work over plain http. Without a proxy, plain http fails: 403 (origin check) without the forwarded protocol, 500 when `ADDRESS_HEADER` is set but the header is missing; `docs/handbook/admin.md` claimed `PROTOCOL_HEADER` alone was enough and was corrected. The sync schedule section stays in `database.md`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook now covers operators, agent setups and doc authors. `docker.md` gained a tested Docker Compose setup (grimoire behind Caddy, key from `.env`, the main variables incl. `TZ`, `PROTOCOL_HEADER`, `ADDRESS_HEADER`), a `docker run` variant for an existing proxy and the pieces of a Kubernetes Deployment; the environment table lists every variable. New pages: `agents.md` (operations, MCP with `claude mcp add`, HTTP routes, the `CLAUDE.md` snippet with `/instructions`) and `writing.md` (one topic per file, self-contained sections, how pages are split, IDs and links, MkDocs/Zensical syntax). Index, `nav` in `zensical.toml` and README (published image, link to the Compose setup) updated; `make handbook` builds strictly with no external links in the new pages. Found on the way: grimoire cannot be used directly over plain http, it needs a proxy; documented in `admin.md`.
<!-- SECTION:FINAL_SUMMARY:END -->

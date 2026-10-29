---
id: TASK-48
title: 'Start page: how to connect an agent, and links to the GitHub project'
status: To Do
assignee: []
created_date: '2026-10-29T01:13:00Z'
labels: []
dependencies: []
references:
  - app/src/routes/+page.svelte
  - docs/handbook/agents.md
  - zensical.toml
priority: medium
type: feature
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Whoever opens a grimoire instance learns nowhere on it how to connect an agent. The handbook page "Connecting agents" (`docs/handbook/agents.md`) shows the `claude mcp add` command with the placeholder `https://grimoire.example.com/mcp`, so the reader has to work out the URL of their own instance first. The start page `/` of a running instance knows that URL and can show the command ready to copy.

The user's scope: the Claude Code command is enough on the page; everything else (other clients, HTTP routes, API keys) is a link to the handbook, published at https://elnebuloso.github.io/grimoire/.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/` shows the `claude mcp add --transport http grimoire <url>/mcp --header "Authorization: Bearer <key>"` command with the origin of the instance it is served from, not a placeholder host
- [ ] #2 The `<key>` placeholder stays; the page shows no API key
- [ ] #3 The page links to the handbook page "Connecting agents" for other clients and details
- [ ] #4 `/` links to the GitHub project https://github.com/elnebuloso/grimoire
- [ ] #5 A test checks that the command carries the request origin, also behind a proxy with `PROTOCOL_HEADER` set
<!-- AC:END -->

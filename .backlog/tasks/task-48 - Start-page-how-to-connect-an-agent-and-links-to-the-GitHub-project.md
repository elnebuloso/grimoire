---
id: TASK-48
title: 'Start page: how to connect an agent, and links to the GitHub project'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T01:13:00Z'
updated_date: '2026-10-31 00:17'
labels: []
milestone: m-1
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
- [x] #1 `/` shows the `claude mcp add --transport http grimoire <url>/mcp --header "Authorization: Bearer <key>"` command with the origin of the instance it is served from, not a placeholder host
- [x] #2 The `<key>` placeholder stays; the page shows no API key
- [x] #3 The page links to the handbook page "Connecting agents" for other clients and details
- [x] #4 `/` links to the GitHub project https://github.com/elnebuloso/grimoire
- [x] #5 A test checks that the command carries the request origin, also behind a proxy with `PROTOCOL_HEADER` set
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pass `url.origin` from the `/` load function
2. Render the `claude mcp add` command with it, a link to the handbook page `agents/` and to the GitHub repository
3. e2e test against the e2e server, which runs with `PROTOCOL_HEADER=x-forwarded-proto`
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`url.origin` is what adapter-node derives per request (`https` unless `PROTOCOL_HEADER` names a header), so the e2e server with `PROTOCOL_HEADER=x-forwarded-proto` and `X-Forwarded-Proto: http` shows `http://localhost:4173/mcp`. Handbook URL checked against the built `site/agents/index.html`. Only the repository link, no issues or releases links (asked in chat, unanswered).

`make lint`, `make test`, `make e2e` (9) and `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`/` shows `claude mcp add --transport http grimoire <origin>/mcp --header "Authorization: Bearer <key>"` with the origin of the serving instance, links to https://elnebuloso.github.io/grimoire/agents/ for other clients and to https://github.com/elnebuloso/grimoire. The e2e test checks the exact command behind `PROTOCOL_HEADER` and both links. `agents.md` mentions the start page.
<!-- SECTION:FINAL_SUMMARY:END -->

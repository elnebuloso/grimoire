---
id: TASK-185
title: Let the operator rename grimoire per instance
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 21:29'
updated_date: '2026-10-30 22:11'
labels:
  - ops
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 247000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As an operator I want to run grimoire in my company under a name of our own (e.g. "Acme Docs"), set with one environment variable.

A new variable, e.g. `INSTANCE_NAME`, declared in `app/src/env.ts` with `defineEnvVars`, optional, default `grimoire`. Wherever grimoire names the instance to people or agents, the name comes from it:
- header wordmark (`app/src/routes/+layout.svelte`), start page heading (`app/src/routes/+page.svelte`)
- document titles: `document_title` and the check in `app/src/lib/components/PageHead.svelte` that keeps titles naming grimoire as they are (today `includes(grimoire)`)
- messages naming grimoire in every `app/messages/<locale>.json` (`login_title`, `setup_title`, `admin_title`, `source_preview_no_snippets`, `field_public`, `mail_reset_subject`, `mail_reset_text`), as a `{name}` parameter
- the MCP server name in `app/src/lib/server/agent/mcp.ts`, the agent instructions where they name grimoire, and the server name in the `claude mcp add` example on the start page

What stays `grimoire`: references to the product itself (the GitHub link and the handbook link on the start page), IDs (`grimoire-id.ts`), cookie names, log fields and other internals.

The name is plain text everywhere: escaped in HTML, never interpreted as markup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Without `INSTANCE_NAME` everything reads as today
- [ ] #2 With `INSTANCE_NAME=Acme Docs` the header, the start page heading, every document title, the messages listed in the description in every language, the reset mail and the MCP server name and instructions say Acme Docs
- [ ] #3 The `claude mcp add` example on the start page uses a server name derived from the instance name that works as a CLI argument
- [ ] #4 Links to the product (GitHub, handbook) and internal names stay grimoire
- [ ] #5 A name with HTML characters such as `<b>Docs</b>` is shown as text
- [ ] #6 Tests cover the default, a custom name on a page title, a message, the mail and the MCP server name
- [ ] #7 `INSTANCE_NAME` is documented in `app/.env.example` and in the environment variables table of `docs/handbook/docker.md`
- [ ] #8 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. INSTANCE_NAME in env.ts (trimmed, default grimoire); root layout passes it as instanceName in page data
2. Messages naming grimoire take {name}; PageHead suffixes with the name, namesInstance replaces the includes('grimoire') check
3. Start page title, header wordmark, reset mail, MCP server name, agentInstructions(name); claude mcp add uses slugify(name)
4. Specs, stories, .env.example, docker.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- PageHead reads the name from page.data ($app/state); Storybook gets it through sveltekit_experimental.state.page in preview.ts.
- agentInstructions is now a function of the name: replaces 'grimoire' in instructions.md.
- Footer link names (footer_github) stay grimoire: they point at the product (TASK-186).
- Checked by hand with INSTANCE_NAME="<b>Acme</b> Docs": escaped in title and header, plain text in MCP serverInfo and instructions, example server name b-acme-b-docs.
<!-- SECTION:NOTES:END -->

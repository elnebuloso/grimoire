---
id: TASK-396
title: 'Spike: find the sources that belong to the code an agent works on'
status: To Do
assignee: []
created_date: '2026-11-08 19:24'
labels:
  - agent-api
  - admin
dependencies: []
priority: low
type: spike
ordinal: 458000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea (owner conversation, 2026-11-08): an agent only queries grimoire when it knows that internal documentation on a subject exists. One that imports `@acme/billing-client` or sees an `acme-auth` image in `docker-compose.yml` cannot tell that it is internal and answers from its training instead. If a source names what it describes in identifiers of the code world (package names, image names, repository URLs, service names), an agent could pass what it sees in its project once at the start of a session and learn which sources apply, the internal counterpart of resolving a library name in Context7. Today a source has a name and a short description that `sources` returns; nothing ties it to code. No connector and no writing: grimoire only reads Git (`docs/CONCEPT.md`). The agent instructions are at 995 of 999 characters (`operations.spec.ts`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The notes say where the identifiers of a source would be kept (a source setting in the management area, frontmatter of a page in the repository, or both) and who maintains them
- [ ] #2 The notes say which identifiers an agent can read cheaply from a project (manifests such as `package.json` or `go.mod`, image names, its Git remote) and how they are matched against those of the sources
- [ ] #3 The notes compare a new MCP tool with a filter on `sources`, including what it costs in the agent instructions within their character limit
- [ ] #4 The notes end with a recommendation for the owner: no change, or a follow-up task
<!-- AC:END -->

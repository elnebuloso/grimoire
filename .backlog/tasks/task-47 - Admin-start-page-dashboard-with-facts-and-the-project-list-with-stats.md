---
id: TASK-47
title: 'Admin start page: dashboard with facts and the project list with stats'
status: To Do
assignee: []
created_date: '2026-10-29T01:09:00Z'
labels:
  - admin
dependencies:
  - TASK-45
references:
  - app/src/routes/admin/+page.svelte
  - app/src/routes/admin/+page.server.ts
priority: medium
type: feature
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`/admin` lists only project slugs and descriptions. To see whether anything needs attention (a failed sync, a source that was never synced, sync warnings) the admin has to open every project and every source one by one.

The public start page (TASK-45) gets the per-project figures without source details; the admin page shows the same figures and can also show what the public page must hide (error messages, which source is affected), since the admin is logged in. The per-project figures come from the same code on both pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A dashboard on `/admin` shows totals across all projects: projects, sources, pages, snippets, tokens, dead links and API keys
- [ ] #2 The dashboard lists every source that needs attention (sync error, sync warnings, never synced) with project, source slug, the reason and the error message, each linked to its source page
- [ ] #3 With nothing to attend to, the dashboard says so instead of showing an empty list
- [ ] #4 The project list on `/admin` shows for each project the same figures as the public start page: sources, pages, snippets, tokens, oldest last sync, sources with a sync error, dead links
- [ ] #5 The per-project figures are computed by the same code as on the public start page
- [ ] #6 Tests cover the totals and the attention list for a source with an error, one with warnings, one never synced and one in sync
<!-- AC:END -->

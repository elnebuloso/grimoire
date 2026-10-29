---
id: TASK-47
title: 'Admin start page: dashboard with facts and the project list with stats'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29T01:09:00Z'
updated_date: '2026-10-29 01:46'
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
- [x] #1 A dashboard on `/admin` shows totals across all projects: projects, sources, pages, snippets, tokens, dead links and API keys
- [x] #2 The dashboard lists every source that needs attention (sync error, sync warnings, never synced) with project, source slug, the reason and the error message, each linked to its source page
- [x] #3 With nothing to attend to, the dashboard says so instead of showing an empty list
- [x] #4 The project list on `/admin` shows for each project the same figures as the public start page: sources, pages, snippets, tokens, oldest last sync, sources with a sync error, dead links
- [x] #5 The per-project figures are computed by the same code as on the public start page
- [x] #6 Tests cover the totals and the attention list for a source with an error, one with warnings, one never synced and one in sync
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `dashboard(db)` in `admin/status.ts`: totals summed from `projectStats` plus the API key count, and the sources needing attention
2. `ProjectStatsTable.svelte` shared by `/` and `/admin`, with a snippet for the name cell so the admin page can link it
3. `/admin` page: overview, needs attention, projects
4. Unit tests in `status.spec.ts`, e2e check that the failed source shows up and links to its page
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`projectStats` gained `id` for the admin links; it is in the public page data too, a numeric row ID, no source detail. Existing e2e locators for the project link needed `exact: true`, because the attention list also links `platform/auth-service`.

`make lint`, `make test` (288), `make e2e` (9) and `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
`/admin` shows totals (projects, sources, pages, snippets, tokens, dead links, API keys), a "Needs attention" list of sources with a sync error (with the message), sync warnings (listed) or no sync yet, each linked to its source page, and the project list with the same figures as `/`. Both pages compute the figures with `projectStats` and render them with `ProjectStatsTable.svelte`. Empty state: "Every source is synced without errors or warnings." Tests: `status.spec.ts` (totals, attention list with error, warnings, never synced and in-sync sources), e2e for the failed source.
<!-- SECTION:FINAL_SUMMARY:END -->

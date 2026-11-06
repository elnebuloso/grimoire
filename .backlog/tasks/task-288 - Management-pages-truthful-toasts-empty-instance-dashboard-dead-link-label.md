---
id: TASK-288
title: 'Management pages: truthful toasts, empty-instance dashboard, dead-link label'
status: To Do
assignee: []
created_date: '2026-11-06 15:59'
labels:
  - admin
dependencies: []
priority: low
type: bug
ordinal: 350000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Four small behaviour errors in the management area:
- Saving any source that syncs automatically toasts "A sync has started." The route requests an unforced check on every save (`app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts`) and the toast reads `syncPending`, so renaming a source announces a sync that is only an `ls-remote`. The route already knows `changes.reindex`.
- Acting on something already gone reports success: `withdraw` and `unlink` (`manage/users/+page.server.ts`) and both `revoke` actions (`manage/api-keys/+page.server.ts`, `account/api-keys/+page.server.ts`) ignore whether anything was removed, while `resend`, `promote`, `demote`, `delete` and `passwordLink` answer 404.
- An instance without sources shows `admin_all_fine` ("Every source is synced without errors or warnings.") on the dashboard (`manage/+page.svelte`), the first screen after `/setup`. The start page has `no_sources_yet` for this state.
- From 1,000 dead links on, the dashboard link shows `toLocaleString()` ("1,234" / "1.234") while its `aria-label` passes the raw number into `admin_dead_links`, a `label-content-name-mismatch` axe would fail; the dashboard has no story.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Saving a source toasts a sync only when a reindex was started
- [ ] #2 `withdraw`, `unlink` and both `revoke` actions answer 404 when nothing was removed, like the other actions
- [ ] #3 The dashboard of an instance without sources says so and points to "New source"
- [ ] #4 The dead-link label contains the formatted number
<!-- AC:END -->

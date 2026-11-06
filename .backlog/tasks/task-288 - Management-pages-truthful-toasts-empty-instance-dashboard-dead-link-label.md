---
id: TASK-288
title: 'Management pages: truthful toasts, empty-instance dashboard, dead-link label'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:59'
updated_date: '2026-11-06 17:58'
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
- [x] #1 Saving a source toasts a sync only when a reindex was started
- [x] #2 `withdraw`, `unlink` and both `revoke` actions answer 404 when nothing was removed, like the other actions
- [x] #3 The dashboard of an instance without sources says so and points to "New source"
- [x] #4 The dead-link label contains the formatted number
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Saving an existing source answers { saved, reindexing } instead of redirecting; the toast announces a sync only when a reindex started
2. revokeInvitation, revokeApiKey and removeIdentity report whether they removed anything; withdraw, unlink and both revoke actions answer 404 otherwise
3. The dashboard of an instance without sources says no_sources_yet and links New source
4. The dead-link label passes the formatted number
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Specs for the 404s failed before the fix and pass after; sources.spec checks reindexing false for a plain save and true for a changed path; manage.e2e checks the empty dashboard right after the setup.
- AC #4 has no test: 1,000 dead links are not staged anywhere; the label and the text now come from the same count() formatter.
- The sources spec helper thrown() now returns a handler's answer when it does not throw.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Saving a source toasts 'A sync has started' only when a reindex was started (the action answers whether it did). Withdraw, unlink and both revoke actions answer 404 when nothing was removed, like the other actions. The dashboard of an empty instance says 'No sources yet.' with a link to New source instead of 'every source is synced'. The dead-link label uses the same formatted number as the link text. Specs and manage.e2e cover all but the label.
<!-- SECTION:FINAL_SUMMARY:END -->

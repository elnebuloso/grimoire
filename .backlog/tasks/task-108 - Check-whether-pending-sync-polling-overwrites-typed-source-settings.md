---
id: TASK-108
title: Check whether pending-sync polling overwrites typed source settings
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
updated_date: '2026-10-30 03:39'
labels:
  - admin
milestone: m-0
dependencies: []
references:
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte'
priority: low
type: spike
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Raised by a code review of the management area on 2026-10-30 as an open question; nothing was run.

While a sync of a source is pending, the source page (`app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.svelte`, around lines 22-26) calls `invalidateAll` every 2 seconds. The settings form below receives its values from page data. Whether a refresh overwrites what the admin is typing depends on how Svelte 5 re-applies a spread `value` attribute when the data value is unchanged; that was not checked. If it does overwrite, an admin editing settings during a sync loses their input.

Try it in the agent environment (`make agent-start`, `http://localhost:5174`, login `agent` / `agent-password`): start "Sync now" on a source and type into its settings while the sync is pending.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Checked in the agent environment, or in a browser test, whether text typed into the source settings survives the polling refresh during a pending sync; result recorded in the notes
- [x] #2 If input is lost, it no longer is, with a test that reproduces it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce in the agent environment with a headless browser: press 'Sync now' on `platform/docs`, type into branch, username and exclusions while the sync is pending, log the field values after every POST and every `__data.json` refresh.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Result: the polling does not overwrite typed input. Text typed after the 'Sync now' page has loaded survived both `invalidateAll` refreshes of the pending sync and the final one when it finished ('typed-branch' kept). Text is lost only when it is typed while the 'Sync now' POST itself is in flight: that form is a plain POST answered with a 303 back to the page, i.e. a full navigation, which discards any form like a page load does. That is expected browser behaviour, not the polling. No code change.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Checked in the agent environment with a headless browser: the 2-second polling during a pending sync keeps what the admin typed into the source settings. Input is lost only if typed while the 'Sync now' request itself navigates, which is a normal page load. No change needed.
<!-- SECTION:FINAL_SUMMARY:END -->

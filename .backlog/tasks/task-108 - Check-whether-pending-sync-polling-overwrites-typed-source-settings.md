---
id: TASK-108
title: Check whether pending-sync polling overwrites typed source settings
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 03:00'
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
- [ ] #1 Checked in the agent environment, or in a browser test, whether text typed into the source settings survives the polling refresh during a pending sync; result recorded in the notes
- [ ] #2 If input is lost, it no longer is, with a test that reproduces it
<!-- AC:END -->

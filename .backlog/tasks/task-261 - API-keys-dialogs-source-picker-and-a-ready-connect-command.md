---
id: TASK-261
title: 'API keys: dialogs, source picker and a ready connect command'
status: To Do
assignee: []
created_date: '2026-11-05 20:46'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-251
  - TASK-258
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 323000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After creating a key the user has to go to the start page for the connect command and replace `<key>` by hand; a reload after creating can create a second key; the change disclosure reads "Change <name>" like switching users; the admin list shows neither expiry nor a link to the owner (findings U19, U20, W2). With hundreds of sources (owner decision O6) a checkbox per source is unusable.

Measure M14 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Creating and changing a key happen in a dialog; choosing sources uses a searchable `SourcePicker` that shows the chosen ones
- [ ] #2 With 500 sources a key for three given sources can be created by search without scrolling a list
- [ ] #3 After creating, a result shows the key once and the connect command with the key filled in; a reload does not create a second key
- [ ] #4 The admin list of all keys shows expiry and expired state, links the owner and filters by owner
- [ ] #5 `SourcePicker` has stories with axe
<!-- AC:END -->

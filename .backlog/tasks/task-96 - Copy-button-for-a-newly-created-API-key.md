---
id: TASK-96
title: Copy button for a newly created API key
status: To Do
assignee: []
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:02'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new key is shown exactly once and has to be selected by hand. A slip leaves out a character, and the agent fails with an unknown key that cannot be shown again.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Next to the new key there is a button that copies it to the clipboard and confirms it in a `role="status"` message
- [ ] #2 Without clipboard access the key can still be selected and copied by hand
- [ ] #3 A story covers the button, including the confirmation
<!-- AC:END -->

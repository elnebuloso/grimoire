---
id: TASK-131
title: Keep mail recipient addresses out of the log
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: bug
ordinal: 193000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found in the whole-project code review of 2026-10-30. A failed mail logs the recipient address (`app/src/lib/server/mail/smtp.ts` around line 191). With one admin this is harmless; once there are more users the log holds personal addresses, and it is shipped as ECS to wherever logs go. The log needs to say that a mail failed and why, not to whom.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No log line written by the mail code contains a recipient address
- [ ] #2 A failed mail is still logged with the error and the kind of mail
- [ ] #3 A test checks the failure log entry does not contain the address
<!-- AC:END -->

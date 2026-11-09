---
id: TASK-131
title: Keep mail recipient addresses out of the log
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 09:45'
updated_date: '2026-10-30 10:21'
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
- [x] #1 No log line written by the mail code contains a recipient address
- [ ] #2 A failed mail is still logged with the error and the kind of mail
- [ ] #3 A test checks the failure log entry does not contain the address
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Log the mail subject instead of the recipient, and log only the error message (with the recipient replaced, case-insensitively) and code, not the whole error object whose rejected list and response quote the address.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A failed mail is logged as 'Sending mail "<subject>" failed' with the error message and code; the recipient is replaced by <recipient> in the message, and nodemailer's error properties that list rejected addresses are no longer logged. New test with an EENVELOPE error quoting the address in another case; it and the adjusted existing test fail against the old code.
<!-- SECTION:FINAL_SUMMARY:END -->

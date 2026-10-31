---
id: TASK-192
title: Run a code audit before 1.0.0
status: To Do
assignee: []
created_date: '2026-10-30 23:20'
labels: []
milestone: m-1
dependencies: []
priority: high
type: task
ordinal: 254000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit the whole codebase before it leaves 0.x: at least one run of `/ponytail:ponytail-audit` (bugs, security holes, load, untested risky code, what to delete), and `/charter:code-audit` for correctness, security and structure. Findings worth fixing become backlog tasks in this milestone (e.g. with `/charter:backlog-from-code-audit`). The user decides when the audit is done; this task is not closed without their word.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 At least one `/ponytail:ponytail-audit` run over the whole repository is recorded
- [ ] #2 The findings are triaged with the user and the ones to fix are backlog tasks in this milestone
- [ ] #3 The user has declared the audit done
<!-- AC:END -->

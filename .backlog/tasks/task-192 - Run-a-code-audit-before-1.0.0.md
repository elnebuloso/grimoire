---
id: TASK-192
title: Run a code audit before 1.0.0
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 23:20'
updated_date: '2026-10-31 02:01'
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
- [x] #1 At least one `/ponytail:ponytail-audit` run over the whole repository is recorded
- [x] #2 The findings are triaged with the user and the ones to fix are backlog tasks in this milestone
- [x] #3 The user has declared the audit done
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Two /ponytail:ponytail-audit runs over the whole repository on 2026-10-31. Run 1 (auth, API keys, sync, includes, search, agent routes, DB layer, admin sources) found 4 issues: TASK-203 to TASK-206. Run 2 (what run 1 left out: Svelte pages and components, chunker and slugs, mail, logging, scripts/, Makefile, CI, plus make lint/test/e2e) found 2: TASK-207, TASK-208. All six were triaged with the user, assigned to milestone m-1 and fixed. /charter:code-audit, named in the description, was not run; the user declared the audit done with the two ponytail runs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Code audit before 1.0.0 done with two /ponytail:ponytail-audit runs over the whole repository. Their six findings became TASK-203 to TASK-208 in milestone m-1 and are all fixed: a 500 on repairing a source after a key change, lost re-index of paused sources, a server stall when deleting a large source, duplicated SHA-256 helpers, headings with only subheadings being unlinkable, and the reset script failing on a held lock. Final run green: make lint, make test (728), make e2e (21), make image, make image-smoke. The user declared the audit done; /charter:code-audit was not run.
<!-- SECTION:FINAL_SUMMARY:END -->

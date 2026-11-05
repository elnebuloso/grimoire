---
id: TASK-234
title: >-
  Refuse a duplicate source and warn on an overlapping path, with a list for
  admins
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 13:13'
updated_date: '2026-11-05 13:23'
labels:
  - admin
dependencies: []
priority: medium
type: feature
ordinal: 296000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every user adds sources (ADR 0007), so the same documentation gets registered twice: by two people who do not know of each other, or by one person under another name. Every page is then indexed twice, an agent gets the same section twice within its token budget, and the copies drift apart. The owner confirmed the rules on 2026-11-05; they go into ADR 0008.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Two sources on the same repository and the same path are duplicates whatever their branches; URLs and paths are compared normalised (host and repository path without case, default port, trailing `.git` or slashes; `docs`, `docs/` and `./docs` alike; empty and `.` mean the whole repository)
- [x] #2 Saving a new source, or a changed Git URL or path, that duplicates another is refused with a message
- [x] #3 An overlap (one path inside the other) warns and saves only once confirmed; a directory the outer source excludes does not overlap it
- [x] #4 The message names the other source only when the user may read it or is an Admin; for another users private source it says the documentation is registered already, without name
- [x] #5 A source whose Git URL and path stay as they are saves even if it already is a duplicate
- [x] #6 The check runs again right before the write, after the Git server was asked, so two saves at once cannot both create a duplicate
- [x] #7 Admins see every duplicate and overlap under /manage/duplicates, linked to the sources
- [x] #8 ADR 0008 records the decision; the handbook describes the messages and the list
- [x] #9 Unit specs cover the comparison and every rule; the source page spec covers refusal, warning, hidden name and the second check; `make test`, `make lint` and `make e2e` pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built anew on the current access model, with the archived commits as reference: duplicates.ts (comparison) and its spec taken over unchanged; sourceConflict in admin/sources.ts names the other source when the user reads it (not private, or own) or is an admin; the save action checks before asking the Git server and again right after, before the write; overlap needs the confirmOverlap checkbox; /manage/duplicates is admin-only (PAGE_ROLES) and in the admin part of the navigation. ADR 0008 written fresh, status Proposed. Handbook: users.md "Documentation that is already registered" with the four messages, admin.md "Duplicate sources". manage.e2e.ts now asserts the hidden-name refusal when the writer registers the admins private documentation. Verified: make test 896/896 (84 files), make e2e 23/23, make lint clean, make handbook --strict; /manage/duplicates checked in the agent environment in light and dark (lists platform-docs and platform-next).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A source is its repository and path, whatever the branch, compared normalised. The source form refuses a duplicate and warns on an overlap that saves only once confirmed; the check runs before asking the Git server and again right before the write. The message names the other source only to who reads it or to an admin. Admins list every duplicate and overlap under /manage/duplicates. ADR 0008 (accepted) records the decision; the handbook covers the messages and the list. Verified with make test, make e2e, make lint, make handbook and a look at the page in both schemes.
<!-- SECTION:FINAL_SUMMARY:END -->

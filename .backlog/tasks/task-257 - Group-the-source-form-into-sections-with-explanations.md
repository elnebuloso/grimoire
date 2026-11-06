---
id: TASK-257
title: Group the source form into sections with explanations
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 00:26'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-256
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 319000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The source form lists 13 fields one under the other; access (URL, branch, username, token) is not grouped, username and token have no explanation of when they are needed and which rights the token needs (finding U24, chapter 10.4).

Measure M10 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The form for a new source and the settings of a source show the sections Allgemein, Repository, Zugang, Zeitplan und Sichtbarkeit
- [x] #2 Username and token explain when they are needed and which rights the token needs
- [x] #3 "Test connection" sits with repository and access
- [x] #4 A `FormSection` component has stories with axe
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Owner rules R1-R9 (2026-11-06): four sections for new source and Settings: General (name with slug preview, description, documentation site), Repository (Git URL, branch, path, exclusions), Access (username, token, one sentence when needed, a small table of token kinds per Git host, remove options, then "Test connection"), Schedule and visibility (schedule with global default and next check, paused, visibility). Fields, validation, public confirmation, overlap confirmation and toasts unchanged. Cron in words stays for TASK-266.
2. `FormSection` component (sheet with heading, lead, content) with stories and axe.
3. "Test connection" sits before "Save" in the form: a hidden first submit button keeps Enter saving.
4. e2e and handbook where they name the form.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The form is four `FormSection` sheets (General, Repository, Access, Schedule and visibility) in the snippet `settings` of `manage/sources/[id]/[[tab=tab]]/+page.svelte`; the "Settings" heading left the tab, the sections carry the headings. Access holds a small table of token kinds per Git host (the same as the handbook) and ends with "Test connection". A hidden first submit button keeps Enter saving: checked in Chromium, Enter in a field posted `?/save`. Cron in words stays for TASK-266.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The source form, for a new source and on Settings, is grouped into General, Repository, Access and Schedule and visibility. Access says when username and token are needed, lists the token kind each Git host needs, and ends with "Test connection". `FormSection` has stories. Verified: `make lint`, `make test` (1033 tests), `make e2e` (28 passed), `make handbook`, by hand (Enter still saves; both schemes).
<!-- SECTION:FINAL_SUMMARY:END -->

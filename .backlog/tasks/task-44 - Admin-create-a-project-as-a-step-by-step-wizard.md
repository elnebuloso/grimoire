---
id: TASK-44
title: 'Admin: create a project as a step-by-step wizard'
status: To Do
assignee: []
created_date: '2026-10-29T01:04:00Z'
labels:
  - admin
dependencies: []
references:
  - app/src/routes/admin/projects/[id]/+page.svelte
  - app/src/routes/admin/projects/[id]/sources/[sourceId]/+page.svelte
priority: medium
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creating a project today takes two separate stops: the form at `/admin/projects/new` saves only slug and short description, and the first source has to be added afterwards from the project page via "New source". A project without a source serves nothing, and nothing guides the operator from one step to the next. A wizard leads through project data and the first source in one flow.

Editing an existing project and its sources stays on the current pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Creating a new project leads through ordered steps: project data (slug, short description), first source (the fields of the source form), summary
- [ ] #2 Each step validates its input before the next one opens; errors are shown in the step they belong to
- [ ] #3 Going back to an earlier step keeps the values already entered, except the token, which is never rendered
- [ ] #4 Nothing is written to the database before the summary step is confirmed; aborting the wizard leaves no project behind
- [ ] #5 After confirming, the project and its first source exist and the operator lands on the project page
- [ ] #6 The wizard works without client-side JavaScript (plain form posts)
- [ ] #7 Unit tests cover the step validation and the final create; the Playwright e2e test for creating a project runs through the wizard
<!-- AC:END -->

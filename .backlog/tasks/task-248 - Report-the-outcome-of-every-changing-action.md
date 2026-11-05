---
id: TASK-248
title: Reactive forms and a toast for every changing action
status: To Do
assignee: []
created_date: '2026-11-05 20:45'
updated_date: '2026-11-05 20:57'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some actions confirm what they did (settings saved, slug changed, password changed), others end silently: saving or deleting a source, revoking a key, withdrawing an invitation, granting the admin role. After saving a source the page only says a sync is queued, even when only the description changed. Admins have to inspect the result to know whether an action took effect (finding U4 in the concept, chapter 12.3). Almost every form today is a plain POST with a full page reload; only the source page uses `use:enhance`.

Owner decision 2026-11-05: the web UI is a reactive Svelte application, JavaScript is required and no fallback without it is kept; only the pages with `csr = false` stay plain forms for their technical reasons (rule in `.claude/rules/ui-components.md`).

Measure M1 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The message covers at least: password change, linking and unlinking an identity, creating, changing and revoking a key, creating, saving, syncing, renaming and deleting a source, inviting, re-sending and withdrawing an invitation, granting and removing the admin role, unlinking a user's identity, deleting a user, pausing syncs, export
- [ ] #2 Saving a source says that a sync was started only when the change actually triggers one
- [ ] #3 Field errors stay in the form next to the field, as today
- [ ] #4 Outside the pages with `csr = false`, no form triggers a full page reload: forms use `use:enhance`, scroll position and input stay, affected data refresh in place
- [ ] #5 While an action runs its button is disabled and shows that it is working
- [ ] #6 Success appears in a `Toast` that names the affected item (e.g. the key or source name): fixed in a corner, visible while scrolling, gone after about five seconds, kept while hovered, closable, several stacked with the newest on top
- [ ] #7 `Toast` has stories for each state with axe
<!-- AC:END -->

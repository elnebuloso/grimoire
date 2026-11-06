---
id: TASK-329
title: 'Source save: refuse when the source changed while the Git server was asked'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - admin
dependencies: []
references:
  - 'app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts'
  - app/src/lib/server/admin/sources.ts
priority: medium
type: bug
ordinal: 391000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The save action in `app/src/routes/manage/sources/[id]/[[tab=tab]]/+page.server.ts` (around lines 145-177) reads the stored source (`storedSource`), computes `savingChanges`, and runs `sourceProblem` (slug check) and `remoteProblem` (token-origin check) before it awaits the Git access check (up to 15 s + 60 s). After the await, only the duplicate check (`sourceConflict`, as `late`) runs again.

Cases within that window:
- Two admins create sources with the same name on different repositories: the second `INSERT` hits `slug UNIQUE` and answers 500; the form, including an entered token, is lost.
- Admin A edits the branch of a source on server X (this triggers the Git check). Meanwhile admin B changes its URL to server Y and enters a token for Y. A's save writes URL X back but keeps B's token, because A entered none. The next sync sends Y's token to X – exactly what `remoteProblem` prevents.
- B changes the path meanwhile; A's form still has the old one, `changes.index` was computed against the stale stored source and is false, so `last_commit` stays and the index is not rebuilt.

Suggested fix: after the await, read `storedSource` again; if it differs from the one read before, refuse with a form error saying the source changed meanwhile and must be reloaded (new message key in every `app/messages/<locale>.json`, German per `.claude/rules/glossary-de.md`). Run `sourceProblem` again next to `late`. Both are synchronous, so no new race opens.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A save whose source was changed by another save while the Git server was asked is refused with a form error and writes nothing
- [ ] #2 Two new sources with the same name saved at the same time end in a form error for the second, not a 500
- [ ] #3 A save without a concurrent change works as before
- [ ] #4 Specs in `sources.spec.ts` cover both, in the style of the existing spec for a duplicate created while the Git server was asked
<!-- AC:END -->

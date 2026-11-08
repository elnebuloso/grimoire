---
id: TASK-385
title: 'Sync: allow * ? [ ] in a source path and in the directories of included files'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 17:07'
labels:
  - sync
dependencies: []
priority: medium
type: bug
ordinal: 447000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A sync fetches only the source's path, then the directories of files its pages include, with `git sparse-checkout set -- <path>` (`app/src/lib/server/sync/git.ts:180`) and `git sparse-checkout add` (`git.ts:186`, called from `app/src/lib/server/sync/index-source.ts:176-184`). In cone mode git refuses directory names containing `*`, `?`, `[`, `]` or `\` unless `--skip-checks` is passed (message of git 2.43: "specify directories rather than patterns … If your directory really has any of '*?[]\' in it, pass --skip-checks"). Not yet confirmed against a real clone.

Cases: a source with the path `content/[lang]` passes "Test connection", because `remotePathExists` uses `git cat-file`, but every sync then fails with the misleading kind `unreachable`. A page with `--8<-- "shared/[v2]/note.md"` outside the source path fails the whole sync of that source instead of giving a warning; the failure kind does not repeat, so every interval clones and parses again.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A spec with a local repository (as sync.spec.ts builds them) syncs a source whose path contains [ and ] and indexes its pages, and fails before the fix
- [x] #2 An include from a directory with such characters outside the source path is fetched and inserted, or reported as a warning; it never fails the sync
- [x] #3 Both sparse-checkout calls handle such names (e.g. --skip-checks), and the escaping git writes in cone mode is checked
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pass --skip-checks to 'git sparse-checkout set' and 'add' in git.ts.
2. Spec in sync.spec.ts: source path content/[lang] with an include from shared/[v2]/ outside it.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced with git 2.43.0 on a real clone: without --skip-checks both calls fail with 'specify directories rather than patterns …'; with it git writes /content/\[lang]/, /a\*b/, /q\?x/ into .git/info/sparse-checkout and checks out exactly those directories (a sibling a_b is not matched by a*b). New spec fails before, passes after; sync.spec.ts and git.spec.ts: 33 passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sources whose path, or the directory of an included file, contains * ? [ ] now sync: both sparse-checkout calls pass --skip-checks, and git escapes the names itself in cone mode (checked by hand with git 2.43). Spec in sync.spec.ts syncs content/[lang] with an include from shared/[v2]/.
<!-- SECTION:FINAL_SUMMARY:END -->

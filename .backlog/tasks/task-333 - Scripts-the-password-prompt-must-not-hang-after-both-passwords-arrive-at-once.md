---
id: TASK-333
title: 'Scripts: the password prompt must not hang after both passwords arrive at once'
status: To Do
assignee: []
created_date: '2026-11-06 22:05'
labels:
  - ops
dependencies: []
references:
  - scripts/prompt.ts
  - scripts/grant-admin.ts
priority: medium
type: bug
ordinal: 395000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`readHidden` in `scripts/prompt.ts` reads a hidden line from the terminal and keeps the rest of a paste in `pending` for the next prompt. When `pending` already holds a full line, `onData(earlier)` resolves the prompt and pauses stdin, but afterwards (around line 40) `process.stdin.resume()` runs anyway: stdin stays active without a listener and keeps the process alive.

Case (reproduced against a copy of the agent database): `printf 'pw\rpw\r' | script -qec "node scripts/grant-admin.ts user@example.com --password" /dev/null` prints "The account is now an admin. Its password was set…" and then hangs until killed. With the two lines sent separately it exits 0. This is the piped recipe `.claude/rules/memory.md` gives for `docker exec -it`, and a two-line paste in a real terminal does the same. Nothing tests `prompt.ts`.

Suggested fix: call `process.stdin.resume()` before the `if (pending)` block, so a resolve from `pending` pauses last.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `grant-admin.ts --password` exits 0 after both passwords arrive in one chunk
- [ ] #2 Typing the passwords one by one still works
- [ ] #3 A spec for `scripts/prompt.ts` with a fake stdin covers both
<!-- AC:END -->

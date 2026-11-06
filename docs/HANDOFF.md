# Handoff

## Where we stand

- The UI redesign (milestone `m-3`) is merged into `main` locally and **not pushed yet**; the owner
  pushes. It adds no migration and no environment variable.
- A full code audit ran in six sequential passes. Its report sits in `docs/audits/`, which git
  ignores; it stays local. **The backlog is the source of work now**, not the report.
- Out of the audit came **30 tasks, TASK-268 to TASK-297**, all To Do, no milestone. Each task
  stands on its own (file, problem, cost, acceptance criteria) and names no audit. High and Medium
  findings are single tasks; Low findings are bundled by area (TASK-288 to TASK-297).
- `.claude/rules/testing-strategy.md` changed: full suites run once **before the push** of a
  batch, not before every commit (details under "Working with the owner").

## Next

1. **Owner pushes `main`.** semantic-release cuts 1.10.0 from the redesign's `feat`/`fix` commits.
   Then: a short summary at the top of the GitHub release with `gh release edit` (app frame, source
   pages with tabs, lists with search and filters, dialogs, grouped needed actions, key and user
   dialogs, German glossary; operators need do nothing). Then delete the branch `redesign`
   (`git branch -d redesign`; confirm with the owner before `git push origin --delete redesign`).
2. **The 30 tasks start**, in batches of a few related tasks, each batch ending with the full
   suites and the owner's push. Recommended order:

| Batch | Tasks | Why together |
|---|---|---|
| 1 | TASK-268, -269, -270, -271 | the four High bugs |
| 2 | TASK-275, -280, -281, -289 | login, sessions, passwords, account |
| 3 | TASK-279, -272, -290, -291 | form refusals, dialogs, lists, switch (shared client code) |
| 4 | TASK-273, -277, -278, -288 | source states, read rule, management load, dashboard |
| 5 | TASK-274, -276, -282, -284, -292, -293 | texts, sync, import, CI, cleanups |
| 6 | TASK-285, -286, -287, -295, -294, -296 | tests, tooling, source page split |
| owner | TASK-283, TASK-297 | need a decision or a Python-Markdown run, not a build |

## Watch out

- **Overlaps between tasks:**
  - TASK-271 (export rebuilt from rows) can make the WAL item of TASK-295 void; do 271 first.
  - TASK-271 and TASK-282 both touch export/import; `export-schema-4.grimoire-export` must still
    import.
  - TASK-268 adds a migration: the new column goes into `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS`,
    and the "Sync errors" table in `docs/handbook/admin.md` quotes the English messages.
  - TASK-279 changes the `QueryForm` story and the pages TASK-289 touches; TASK-286 and TASK-291
    both change the `SegmentedSwitch` stories; TASK-287 and TASK-294 both update the cost table in
    `testing-strategy.md`.
  - TASK-273 and TASK-288 both touch the dashboard / `admin/status.ts`.
- **Reasoned, not reproduced:** TASK-270, -271, -272, -276, -290 describe behaviour read from the
  code. Write the failing test first (bugfix rule); if it cannot fail, say so in the task.
- **Commit type decides the release:** user-visible fixes are `fix`, refactors `refactor`/`chore`,
  test-only work `test`. A fix of something not pushed yet belongs to its task's commit type.
- **Global files** (`hooks.server.ts`, root layout, `vite.config.ts`, a dependency, a migration):
  TASK-268, -281, -285, -287, -292 reach them; full `make test` before that task's commit.
- **Flaky under load, not broken:** in a full `make test`, `auth.spec.ts` (grant-admin child
  process) once hit its 5 s timeout; `make e2e` once timed out starting its web server. Rerun
  before suspecting the code.
- **Not in any task, still unchecked:**
  - `KeyScope` with more than three sources lists them as `<code>…</code>,` inside an `{#each}`;
    whitespace trimming may drop the space (see the story "Many sources, shortened").
  - The sidebar's count next to **Users** counts pending invitations but links to the Users tab,
    not `?tab=invitations`.
- Storybook 10.6.2 lags behind SvelteKit 3: no `refreshAll` in its `$app/navigation` stand-in (use
  `invalidateAll` in components), and its `enhance` never calls the submit function.
- Local leftovers, ignored by git and kept: `.playwright-mcp/`, `docs/redesign/screenshots/`,
  `docs/audits/`.

## Working with the owner

- Before a task is built, read `backlog instructions task-execution`, then give the owner its
  rules as a short table; "go" after the table means build it. Name the points you decided
  yourself. Decisions one question at a time, with a recommendation.
- Per task: targeted tests plus `make format`, then a local commit. Before the push of a batch:
  `make lint`, `make test`, `make e2e`; what they find is a commit of its own, then all three
  again.
- Commit and push only on the owner's word ("commit push" means both). Pull with
  `git pull --rebase origin main`.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

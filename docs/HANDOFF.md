# Handoff

## Where we stand

- The redesign (milestone `m-3`) and all audit work sit on `main` locally, **not pushed**; the owner
  pushes once, everything together.
- **Done:** the 30 audit tasks TASK-268 to TASK-297, TASK-298 to TASK-302 from the owner's
  decisions in TASK-297, and TASK-303 and TASK-304 from the findings of the run. Each task has its
  plan, notes and final summary in the backlog. Nothing is open or in progress.
- Every batch ended green: `make lint`, `make test` (158 files, 1252 tests), `make e2e` (28), and
  `make image` + `make image-smoke` after the import, script and module moves.
- One migration was added: `0008-sync-error-kind.sql` (TASK-268). No new environment variable.

## Next

1. **Owner pushes `main`** (`git pull --rebase origin main` first). semantic-release cuts one
   release from the redesign's and the audit's `feat`/`fix`/`perf` commits (1.10.0).
2. After the pipeline published it: a short summary at the top of the GitHub release with
   `gh release edit`. Content: the redesign (app frame, source tabs, lists with search and filters,
   dialogs, German glossary); sync errors named by kind (redirect, refused host, unresolvable
   host); export without the whole database in memory; refusals at the field; a cancelled provider
   login keeps the user logged in. Operators: **the migration runs on start, nothing else to do**.
3. Then delete the branch `redesign` (`git branch -d redesign`; ask before
   `git push origin --delete redesign`).

## Watch out

- **Behaviour changes a reviewer may trip over:**
  - Saving an existing source answers `{ saved, reindexing }` instead of redirecting (TASK-288).
  - Linking a provider now ends the user's other sessions, like unlinking (TASK-280).
  - The e2e GitLab provider runs on `127.0.0.1:4580`, another site than the app (TASK-270).
  - The e2e Git server listens on `127.0.0.1` and `::1` only (TASK-294).
  - Stories run twice (light and dark): `make test` takes about 164 s now; the cost table in
    `.claude/rules/testing-strategy.md` was measured again.
  - Auth modules moved from `app/src/lib/server/admin/` to `app/src/lib/server/auth/` (TASK-299).
- `make handbook` now also fails on a page missing from `nav` (`scripts/check-handbook-nav.py`,
  TASK-304); `--strict` alone checks only links.
- **Flaky under load, not broken:** `auth.spec.ts` (grant-admin child) once hit its 5 s timeout in
  an earlier run; a story in `ActionMenu` raced its menu close and is fixed. Rerun before suspecting
  the code; a test that turns green on a rerun is fixed, not ignored.
- Local leftovers, ignored by git and kept: `.playwright-mcp/`, `docs/redesign/screenshots/`,
  `docs/audits/`.

## Working with the owner

- Before a task is built, read `backlog instructions task-execution`, then give the owner its
  rules as a short table; "go" after the table means build it. For a run the owner hands over
  whole, the plan and the decisions go into the task notes instead.
- Per task: targeted tests plus `make format`, then a local commit. Before the push of a batch:
  `make lint`, `make test`, `make e2e`; what they find is a commit of its own, then all three
  again.
- Commit and push only on the owner's word ("commit push" means both). Pull with
  `git pull --rebase origin main`.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

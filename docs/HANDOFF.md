# Handoff

## Where we stand

- The redesign (milestone `m-3`) and the whole code audit are built: TASK-268 to TASK-304 are Done,
  each with its plan, notes and final summary in the backlog. Nothing is open or in progress.
- The batch ended with `make lint`, `make test`, `make e2e` green, and `make image-smoke` after the
  import, script and module changes.
- One new migration: `0008-sync-error-kind.sql`. No new environment variable.

## Next

1. **Owner pushes `main`** (`git pull --rebase origin main` first). semantic-release cuts one
   release from all of it; expected a minor version (the redesign carries `feat` commits), but
   the tool decides.
2. **Watch the first CI run closely**: it is the first one with the check job's `setup-uv` and
   `make handbook` step (including `scripts/check-handbook-nav.py`), Node pinned to 24.22.1,
   Playwright's `forbidOnly`, the GitLab mock reached as `127.0.0.1:4580` and the e2e Git server
   on loopback only. Locally all of it passed; on the runner it never ran.
3. Once the release is published: a short summary at its top with `gh release edit` — the
   redesign (app frame, source tabs, lists with search and filters, dialogs, German glossary);
   sync errors named by kind (redirect, refused host, unresolvable host); an export without the
   whole database in memory; refusals shown at the field; a cancelled provider login keeps the
   user logged in. For operators: the migration runs on start, nothing else to do.
4. Delete the branch `redesign`: `git branch -d redesign`; ask before
   `git push origin --delete redesign`.

## Watch out

- **Behaviour a reviewer may trip over:**
  - Saving an existing source answers `{ saved, reindexing }` instead of redirecting.
  - Linking a provider ends the user's other sessions, like unlinking.
  - Starting a provider login no longer ends the current session; the flow carries its hash and
    the callback ends it only on success (the strict cookie never reaches the callback).
  - Auth modules live in `app/src/lib/server/auth/`, no longer in `admin/`.
  - Stories run twice (light and dark); `make test` takes about 164 s.
- **Flaky under load, not broken:** `auth.spec.ts` (grant-admin child process) once hit its 5 s
  timeout. Rerun before suspecting the code; a test that only passes on a rerun gets fixed.
- Local leftovers, ignored by git and kept: `.playwright-mcp/`, `docs/redesign/screenshots/`,
  `docs/audits/` (the audit report; every finding is now a Done task).

## Working with the owner

- Before a task is built, read `backlog instructions task-execution`, then give the owner its
  rules as a short table; "go" after the table means build it. When the owner hands over a whole
  run, plan and own decisions go into the task notes instead.
- Per task: targeted tests plus `make format`, then a local commit. Before the push of a batch:
  `make lint`, `make test`, `make e2e`; what they find is a commit of its own, then all three
  again.
- Commit and push only on the owner's word ("commit push" means both). Pull with
  `git pull --rebase origin main`.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

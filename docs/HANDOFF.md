# Handoff

## Where we stand

- **1.10.0 is released** (redesign plus three audit rounds, about 60 tasks), with an operator
  summary at the top of its GitHub release. Some generated entries there fix changes made within
  the same release; the summary says so.
- **A benchmark exists:** `make benchmark` indexes four vendored documentations (Kubernetes,
  Material for MkDocs, FastAPI, Zensical) and compares every snippet ID, 120 search questions and
  time/memory with `app/benchmark/baseline/`. How it works and how to use it:
  `app/benchmark/README.md`. When to run it: `.claude/rules/testing-strategy.md`.
- **New handbook page** `docs/handbook/search.md` ("Search and index").
- **Open in the backlog:** TASK-368, TASK-369, TASK-370, all found by the benchmark. Nothing in
  progress.
- The last push (benchmark, handbook page, tasks) passed CI and cut no release (no `feat`/`fix`).
  The handbook is deployed only after a release, so `search.md` goes online with the next one.

## Next

1. **TASK-368** first: small, a duplicate front matter key skips one Kubernetes page. The fix
   changes the Kubernetes index baseline by one page: `make benchmark-update`, commit the
   baseline with the fix.
2. **TASK-370**, then **TASK-369**: search work measured with the benchmark. TASK-370 tries one
   ranking change at a time and records every attempt with its numbers in the task notes,
   kept or not. TASK-369 needs a rule the owner should see before it is built (below).
3. Run `make benchmark` before the next release.

Benchmark baseline, answerable questions per documentation = 26:

| | rank 1 | within 3 | within 10 | MRR |
|---|---|---|---|---|
| kubernetes | 8 | 13 | 20 | 0.449 |
| mkdocs-material | 16 | 22 | 25 | 0.734 |
| fastapi | 8 | 16 | 23 | 0.479 |
| zensical | 13 | 18 | 21 | 0.602 |

All 16 questions without an answer still get hits (OR search): that is TASK-369.

## Open decisions

- **TASK-369, what "no good match" means:** a threshold on how many of the searched words the
  best hit contains, a relevance score, or both, and what the agent then sees. Agent-visible
  behaviour: present the rule and its benchmark numbers to the owner before building it.
- **TASK-370, a tokenizer change** (e.g. FTS5 `porter` for word stems) is a schema migration and
  re-indexes every source on the next sync; it also changes German matching. Owner decides once
  the numbers are in.

## Watch out

- **Restart the dev server after pulling sync changes.** A `make dev` or agent environment started
  before such a pull runs old server code against the newer indexing worker, which is read from
  disk at every sync; since 1.10.0 the worker exits with code 1 when the job lacks `serverPid`.
  Symptom: every sync fails with "indexing ended with exit code 1". Also in `memory.md`.
- **`make benchmark` takes about 9 minutes** and needs the network once (it clones the fixture
  repository into `app/.benchmark/`). It is not in CI on purpose.
- **Performance baseline is machine-bound:** update it on the same 4-core machine, or the 2x
  tolerance trips elsewhere. `make benchmark-update` rewrites all three baselines at once; check
  the diff of `*.performance.json` before committing it.
- **Change questions and search code in separate commits**, so each commit's effect on the
  numbers stays readable.
- **For quick iterations** on TASK-370, `BENCHMARK_RUNS=1 make benchmark` indexes each
  documentation once (about 4 minutes); the time/memory comparison is then noisier. Use the full
  run for the baseline. The search ranks are taken from all hits (up to 20), not cut at the
  3000-token budget.
- **Expected IDs are snippet IDs.** A heading whose section is under about 50 tokens is merged into
  its parent and has no ID of its own in `*.index.json` (only an alias `read` accepts); a question
  must name the parent's ID.
- **The vendored copies must stay byte-identical:** `vendor/.gitattributes` in the fixture
  repository says `* -text`; some Kubernetes pages have CRLF on purpose. The git config here has
  `core.autocrlf=input`, which would otherwise rewrite them.
- **Commit types:** a fix of something not yet released is no `fix` (it inflated the 1.10.0
  notes). Use `refactor`/`chore`/`test` and name the original commit.
- **A literal `{ }` in a Paraglide message** is a placeholder; write "curly braces" (in
  `memory.md`).
- **Shell waits:** `pgrep -f` / `pkill -f` match the agent's own shell, so an `until ! pgrep …`
  loop never ends; wait for a port, a file or a database state instead.
- **Not re-verified:** the handbook's backup restore command (`docs/handbook/database.md`) with
  the image since it starts through `tini`; a safety check blocked the `rm` inside `sh -c`. It
  worked on the base image before, and `sh -c` runs under `tini` (checked).
- **The agent environment is running** (dev server, mail catcher, OIDC mock) with fresh fixture
  data; `make agent-stop` when it is not needed.

## Working with the owner

- Replies in German; source, commits, tasks and docs in English.
- When the owner hands over a whole run ("go", "entscheide du"), decide and record the decision
  and its reason in the task notes; ask only for pushes, new follow-up tasks, deletions and
  agent-visible behaviour changes.
- Per task: targeted tests plus `make format`, then a local commit. Before a push: `make lint`,
  `make test`, `make e2e`; what they find is a commit of its own, then all three again.
- Commit and push only on the owner's word. A push of `feat`/`fix` commits to `main` is a
  release: say so before pushing, and after it add the operator summary with `gh release edit`.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

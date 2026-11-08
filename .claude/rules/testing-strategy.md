# Testing strategy

While working, run the cheapest check that can catch what the change can break. The full suites run
once, before the push that ships a batch of tasks; local commits in between don't need them. CI
always runs all of them. What each run costs, and the details of specs, e2e files and the
benchmark, are in `.claude/memory/testing.md`.

## Pick the run by the change

- **`make test TEST=--changed` is the default** after editing code. Vitest follows the imports
  from the uncommitted files to the specs and stories that reach them. A test file changed on its
  own runs just that file: name it in `TEST`.
- **A component or its stories:** `make test TEST=<Component>.stories.svelte`. Look at it in the
  agent environment in light and dark; axe runs in the stories.
- **A server module with specs:** its spec file, or `--changed`. In `src/lib/server/sync/`, run
  `sync-logic.spec.ts` for what a sync decides and `sync.spec.ts`, the slowest file, only when the
  change reaches Git, the indexing process or the database it writes. One failing test:
  `make test TEST="<spec file> -t '<test name>'"`.
- **A page, a load or a form action:** its route spec if there is one, then try it in the agent
  environment with curl or the browser (`.claude/rules/agent-environment.md`). Run the e2e file
  covering the page when the change alters a flow the e2e tests walk through.
- **A message text:** search the old text in `*.e2e.ts`, `*.spec.ts` and `*.stories.svelte`; only
  files that assert it need to run.
- **Styles only:** no test catches a look; check the screen in both schemes instead, and the
  stories of a changed component.
- **`hooks.server.ts`, `app.html`, the root layout, `vite.config.ts`, a
  dependency or a migration:** these reach every page; run `make test` in full before the task's
  commit. `make e2e` waits for the push.
- **Types:** svelte-check sees the whole project; it runs with `make lint`, at the end.
- **Parsing, sync or search:** `make benchmark` after the change and before a release. An intended
  difference is written with `make benchmark-update` and committed with the change.

## Writing tests

- A spec that needs a browser (DOM, `location`, form elements) is named `*.svelte.spec.ts`; it
  runs in Chromium in the project `browser`, not in `server`.
- A new e2e file must not depend on the state another file leaves behind: files run in parallel
  workers, in no fixed order.

## Before each task's commit

`make format` and the targeted run the change calls for (above), plus the e2e file of a flow the
task changed. No `make lint`, full `make test` or full `make e2e` here: a commit that stays local
ships nothing.

## Before the push

Work in batches of a few related tasks. Before the push that ships a batch: `make lint`,
`make test` and `make e2e`, all three, after the last change. A narrow run that passed earlier does
not stand in for them. What they find is fixed in a commit of its own, never by amending, and then
all three run again.

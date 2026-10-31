# Testing strategy

While working, run the cheapest check that can catch what the change can break. The full suites run
once, before the commit that ships the work, or at the end of a batch of tasks. CI always runs all
of them.

## What a run costs

Measured in the agent's shell (4 cores):

| Run | Time |
|---|---|
| `make lint` (prettier and eslint 34 s, then svelte-check 25 s) | 57 s |
| `make test`, all 57 specs and 17 story files | 63 s |
| `make test TEST=--project=server` | 32 s; `sync.spec.ts` is the slowest file, 14 s on its own |
| `make test TEST=--project=storybook` | 26 s |
| `make test TEST=<one spec file>` | 9 s |
| `make test TEST="<one spec file> -t '<test name>'"` | 9 s |
| `make test TEST=<one *.stories.svelte>` | 13–20 s |
| `make test TEST=--changed` | what the changed files reach: nothing changed 9 s, one component (1 story file) 17 s, `src/lib/slug.ts` (11 files) 23 s |
| `make build` | 18 s |
| `make e2e`, production build plus all browser tests | 43 s, of which `manage.e2e.ts` takes 22 s |
| `make e2e E2E=<one *.e2e.ts>` | 19–21 s for `theme` or `language`, 39 s for `manage`, the build included |
| `make format` | 5 s; fixes what the prettier part of `make lint` would report |

Next slowest spec files after `sync.spec.ts`: `migrate.spec.ts` (12 s within the full run, a race
between real processes) and `access.spec.ts` (8 s). Every spec, story and e2e file also passes on
its own.

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
  dependency or a migration:** these reach every page; run `make test` and `make e2e` in full.
- **Types:** svelte-check sees the whole project; it runs with `make lint`, at the end.

## E2E files

- `src/routes/language.e2e.ts` and `src/routes/theme.e2e.ts` run on their own with `E2E=<file>`.
- `src/routes/manage/manage.e2e.ts` is one serial story from the setup on: every test builds on the
  account and data the one before created. Run the whole file; `--grep` on a later test fails on
  missing state, not on the code.
- A new e2e file must not depend on the state another file leaves behind: files run in parallel
  workers, in no fixed order.

## Before the commit that ships

`make lint`, `make test` and `make e2e`, all three, after the last change. A narrow run that passed
earlier does not stand in for them.

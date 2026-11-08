# Testing

## What a run costs

Measured in the agent's shell (4 cores):

| Run | Time |
|---|---|
| `make lint` (prettier and eslint, then svelte-check) | 61 s |
| `make test`: specs, browser specs and every story in light and dark | 200 s |
| `make test TEST=--project=server` | 70 s |
| `make test TEST=--project=browser` (`*.svelte.spec.ts`) | 17 s |
| `make test TEST=--project=storybook` | 80 s: every story twice, in a light and a dark browser |
| `make test TEST=<one spec file>` | 10–17 s; `sync.spec.ts`, the slowest, 31 s |
| `make test TEST="<one spec file> -t '<test name>'"` | 10 s |
| `make test TEST=<one *.stories.svelte>` | 50 s, both schemes and the browser start included |
| `make test TEST=--changed` | what the changed files reach: nothing changed 15 s |
| `make build` | 24 s |
| `make e2e`, production build plus all browser tests | 90 s, of which `manage.e2e.ts` takes most |
| `make e2e E2E=<one *.e2e.ts>` | 26 s for `theme` or `language`, 85 s for `manage`, the build included |
| `make format` | 10 s; fixes what the prettier part of `make lint` would report |
| `make benchmark` | about 11 minutes (three indexing runs per documentation, eight documentations), of which Kubernetes takes most; up to 880 MB of memory |

Measured on 2026-11-06; `make test`, the server project and `sync.spec.ts` again on 2026-11-07.
Every spec, story and e2e file also passes on its own.

- `make test` prints a "JavaScript heap out of memory" crash even when everything passes:
  `sync.spec.ts` runs an indexing child out of memory on purpose. Only the summary at the end
  counts.
- `make test` runs under `prlimit --core=1`, so that child leaves no core dump: a crash handler set
  as core pattern (WSL's, apport) took about 8 s per dump. Running vitest without the target brings
  those seconds back.
- svelte-check run alone may see stale messages: the Paraglide output under
  `app/src/lib/paraglide` is generated, and `make lint` compiles it first.

## Specs

- A spec that mocks `$app/env/private` needs what the modules behind the route read:
  `GIT_ALLOWED_HOSTS: []` for the Git check, `OIDC_PROVIDERS: ''` and `BASE_URL: ''` for login,
  invite and account routes. A missing one fails with
  `No "<NAME>" export is defined on the "$app/env/private" mock`.
- Behind a proxy (`vi.stubEnv('HTTPS_PROXY', …)`) the connection policy refuses every host not in
  `GIT_ALLOWED_HOSTS` without a DNS lookup: a spec of refused sources needs no network.

## E2E files

- `src/routes/language.e2e.ts` and `src/routes/theme.e2e.ts` run on their own with `E2E=<file>`.
- `src/routes/manage/manage.e2e.ts` is one serial story from the setup on: every test builds on the
  account and data the one before created. Run the whole file; `--grep` on a later test fails on
  missing state, not on the code.
- `make e2e` also starts an OIDC mock on port 4580 with the providers `gitlab` (sign-up at
  `e2e.example`) and `entra` (requires `hd=e2e.example`), next to the mail catcher; a test logs
  in through the mock's form with any `username` (the subject) and claims as JSON.
- `make e2e` runs a second, empty instance of the same build on port 4174, with its own database
  and `ENCRYPTION_KEY` and its log in `import-server.log`: `manage.e2e.ts` imports its export there
  on the setup page.
- `make e2e` needs Docker, `openssl` and the ports 4443 (local https Git server), 4173, 4174,
  4125/4825 (mail catcher) and 4580 (OIDC mock).
- `getByRole('button', { name: 'Log in' })` also matches the provider buttons
  (`Log in with GitLab`); use `exact: true`.
- A run keeps the server's log and database in `$TMPDIR/grimoire-e2e-*` (the newest directory is
  the last run); `app/test-results` is overwritten by the next run. After a failure, look there
  before rerunning.

## Benchmark

`make benchmark` indexes eight public documentations (Kubernetes, Material for MkDocs, FastAPI,
Zensical, and in German Kubernetes, i-doit, FastAPI and the Odoo Wiki), copied into
`grimoire-fixture-docs/vendor/` at a commit pinned in `app/benchmark/documentations.ts`, through
the real sync, and compares every snippet ID, the counts, dead links and warnings with
`app/benchmark/baseline/`. It is not part of `make test` or CI: it clones the fixture repository
once into `app/.benchmark/` and takes minutes.

- A difference fails it with a diff per documentation; `make benchmark-update` writes an intended
  one, so the commit shows which IDs moved.
- New vendored copies mean a new fixture commit in `documentations.ts` and a new baseline, in one
  commit.
- The principle, the meaning of each number and the workflow are in `app/benchmark/README.md`.

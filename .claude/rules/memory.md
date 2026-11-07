# Project memory

Facts learned while building grimoire.

## SvelteKit 3

- The `$lib` alias is gone; it is `#lib` (from `imports` in `app/package.json`), imported with a
  `.js` extension: `import { database } from '#lib/server/db/index.js'`.
- `$env/*` is replaced: declare every variable in `app/src/env.ts` with `defineEnvVars`, import it
  from `$app/env/private`. A variable without `schema` is required at build and start; use
  `building` from `$app/env` in the schema to require it only at start.
- `.env` reaches only declared variables, not `process.env`. A variable whose name is not known
  ahead (such as `OIDC_<KEY>_ISSUER`) comes from `process.env`; `make dev` loads `app/.env` there
  with `node --env-file-if-exists`, which `NODE_OPTIONS` does not accept.
- `ServerInit` comes from `@sveltejs/kit/hooks`. adapter-node awaits `init` before it listens.
- adapter-node 6 has no `ORIGIN` variable: the origin is `paths.origin` from the config, else
  derived per request with protocol `https` unless `PROTOCOL_HEADER` names a header. Form POSTs
  over plain `http` therefore fail the CSRF check; test locally with
  `PROTOCOL_HEADER=x-forwarded-proto` and `X-Forwarded-Proto: http`.
- The dev server skips the CSRF origin check (`!__SVELTEKIT_DEV__` in SvelteKit's `respond.js`): a
  form POST with a foreign `Origin` passes there. Try CSRF against the build, never against
  `make dev` or the agent environment.
- `redirect()` to another origin throws unless it names it:
  `redirect(303, url, { external: [origin] })`.
- Param matchers are not files in `src/params/`: they live in `app/src/params.ts`, declared with
  `defineParams` from `@sveltejs/kit/params`. A running dev server (also the agent environment)
  sees a new matcher only after a restart; until then every page answers 500
  `param_matcher_missing`.
- `goto` options: `replace` (not `replaceState`) and `reset: false` (instead of `keepFocus` and
  `noScroll`).
- On a `csr = false` page `resolve()` writes relative links (`../login`): an e2e test follows the
  link and checks the URL instead of comparing `href`.

## Runtime

- Inside the image, Node resolves `localhost` to `::1` first; on the dev machine and the CI runners
  to `127.0.0.1` alone. A test server for both listens on both loopback addresses.
- `node:sqlite` errors carry `code: 'ERR_SQLITE_ERROR'`; a locked database has `errcode` 5.

- Node 24: `node:sqlite` with FTS5 is built in; `node` loads `.ts` files directly (type
  stripping), which tests use to run code in child processes.
- What Node loads without a build (`scripts/` and everything they import) uses no TypeScript
  parameter properties, which type stripping rejects, and imports relatively with the `.ts`
  extension.

## Formatting

- Format with `make format`, never with `npx prettier` from `app/` on `../scripts`: outside `app/`
  Prettier finds no config and rewrites the scripts in its defaults, which `make lint` then
  rejects.

## Dependencies

- A new or updated dependency is at least two weeks old and pinned to an exact version; security
  fixes are the exception. The same holds for base images, images in examples and GitHub Actions.
- A GitHub Action is pinned by the commit SHA of its version tag, with the tag as a comment
  (`actions/checkout@<sha> # v7.0.1`): a tag can be moved. `gh api repos/<owner>/<action>/git/ref/tags/<tag>`
  gives the SHA; an annotated tag needs one more `git/tags/<sha>` lookup.

## Trying things by hand

- Admin forms with curl: a POST without a body gets 415, send `-d ""`. Over plain `http` add
  `-H X-Forwarded-Proto:http -H Origin:<url>` (server with `PROTOCOL_HEADER=x-forwarded-proto`);
  `-H 'x-sveltekit-action: true'` returns the action result as JSON.
- MCP with curl needs `Accept: application/json, text/event-stream`, or the transport rejects the
  request.
- Stop a test server by the PID `ss -ltnp` shows for its port, not by `$!`, which is the PID of
  the wrapping shell or npm. `pkill -f <pattern>` kills the agent's own shell, whose command line
  contains the pattern.
- `docker exec -it` needs a terminal; without one:
  `printf 'new password\nnew password\n' | script -qec "docker exec -it <container> node scripts/grant-admin.ts <email> --password" /dev/null`.
  The output then shows the piped passwords: the pseudo terminal echoes them before the script
  turns echo off. Typed by hand, they stay hidden.
- The OIDC callback page continues by `<meta http-equiv="refresh">`, not by a redirect: curl
  stops there. A login is complete at that point; a link is not until the page's
  `/account/link` is requested with the same cookies.
- `backlog task list --plain | head` crashes (Bun, "Error is not a constructor"); use `--limit`
  instead of `head`.
- The Playwright MCP browser saves screenshots only inside the repository (`.playwright-mcp/`,
  ignored by git), not in the scratchpad.
- A dev server started before an update can run old server code against a newer indexing
  worker, which is read from disk at every sync: after a pull that touches `sync/`, restart
  `make dev` or the agent environment (`make agent-stop && make agent-start`).
- Close the Playwright MCP browser (`browser_close`) once a check by hand is done: it stays open
  in WSL otherwise, and a hung page blocks every later call until it is closed.
- The Playwright MCP browser answers native `confirm()` dialogs on its own in some runs and holds
  them in others; register `page.on('dialog', …)` in the script to decide, and never click a
  destructive action outside the agent environment.
- Sources added to the agent database by hand with made-up Git URLs are synced by its scheduler
  within seconds and end with a sync error; reset afterwards. `make agent-many-sources` adds 500
  paused ones, which the scheduler leaves alone; `make agent-reset` removes them.
- A Playwright click on a button that opens a dialog does nothing before hydration: load the page
  with `waitUntil: 'networkidle'` first.

## UI

- In a message of `app/messages/<locale>.json`, `{…}` is a placeholder: a literal `{ }` in the
  text becomes an input named " ". Name braces in words instead ("curly braces").

- A `ConfirmAction` inside a popover (`ActionMenu`) keeps its dialog inside the popover: hiding
  the popover hides the open dialog with it. `ActionMenu` therefore stays open behind the dialog
  and closes on the dialog's `close`.
- axe fails a button whose `aria-label` does not contain its visible text
  (`label-content-name-mismatch`): `buttonLabel` messages start with the visible label, e.g.
  „Password link for {email}“.
- `getByLabel('Name')` also matches the `SourcePicker` search; use
  `getByRole('textbox', { name: 'Name' })`.

## Storybook

- A native `popover` opened through `popovertarget` gives its button no `aria-expanded` attribute
  to assert, and `userEvent.keyboard('{Escape}')` does not close it: check closing and focus in the
  real browser instead.
- Storybook's `$app/forms` `enhance` never runs the submit function; it dispatches
  `storybook:enhance` on `window` with the submit event, and its `goto` dispatches `storybook:goto`
  with goto's arguments. A story listens to these to see what a form posts or a table navigates to.
- `play` cannot use Storybook's deferred `mount` through the Svelte CSF wrapper
  (`MountMustBeDestructuredError`): stub timers after mount instead.
- Stories run twice, in a light and a dark Chromium instance (`vite.config.ts`), so axe checks
  the contrast of both schemes.

## Database

- A released migration is never edited; a schema change is a new numbered file.
- `/setup` reopens whenever no account has the role `admin`, not only on an empty instance. The
  UI cannot get there (the last admin keeps the role); a direct database edit can.
- `app/src/lib/server/fixtures/export-schema-4.grimoire-export` is never written again. It stands
  for exports made by 1.4.0; specs and the image smoke import it through every later migration.
  Its private source arrives as internal, its users without identities.
- A new column of an exported table fails `instance-export.spec.ts` until it is listed in
  `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS`; a new table until it is in `EXPORTED_COLUMNS` or
  `EMPTIED_TABLES`. A new kind of stored secret would travel encrypted: export and import handle
  only `sources.encrypted_token`.

## Git

- Update with `git fetch origin && git rebase origin/main`. VS Code fetches in the background; a
  fetch at the same moment writes `main` twice into `.git/FETCH_HEAD`, and `git pull --rebase`
  stops with "Cannot rebase onto multiple branches", also with `origin main` named.
- The fixture repository `grimoire-fixture-docs` is pushed over SSH
  (`git@github.com:elnebuloso/grimoire-fixture-docs.git`); an `https` clone has no credentials.

## Releases

- semantic-release (`.releaserc.json`) writes the release notes from the commits on `main`. After
  every release, once the pipeline has published it, add a short summary at the top of its GitHub
  release with `gh release edit`: what the release is about and what an operator has to do, above
  the generated list.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`. `make handbook`
  fails on a page missing from `nav` (`scripts/check-handbook-nav.py`, since `--strict` checks
  only links) and on a broken link.

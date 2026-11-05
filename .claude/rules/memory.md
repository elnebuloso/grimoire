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

## Runtime

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

- Pull with `git pull --rebase origin main`. VS Code fetches in the background; a fetch at the
  same moment writes `main` twice into `.git/FETCH_HEAD`, and a plain `git pull --rebase` stops
  with "Cannot rebase onto multiple branches".

## Releases

- semantic-release (`.releaserc.json`) writes the release notes from the commits on `main`. After
  every release, once the pipeline has published it, add a short summary at the top of its GitHub
  release with `gh release edit`: what the release is about and what an operator has to do, above
  the generated list.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`; `make handbook`
  builds with `--strict`.

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

## Runtime

- Node 24: `node:sqlite` with FTS5 is built in; `node` loads `.ts` files directly (type
  stripping), which tests use to run code in child processes.

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
  the wrapping shell or npm.
- `docker exec -it` needs a terminal; without one:
  `printf 'new password\nnew password\n' | script -qec "docker exec -it <container> node scripts/grant-admin.ts <email> --password" /dev/null`.

## Database

- A released migration is never edited; a schema change is a new numbered file.

## Releases

- semantic-release (`.releaserc.json`) writes the release notes from the commits on `main`. After
  every release, once the pipeline has published it, add a short summary at the top of its GitHub
  release with `gh release edit`: what the release is about and what an operator has to do, above
  the generated list.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`; `make handbook`
  builds with `--strict`.

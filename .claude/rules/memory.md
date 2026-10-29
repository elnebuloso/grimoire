# Project memory

Facts learned while building grimoire.

## SvelteKit 3

- The `$lib` alias is gone; it is `#lib` (from `imports` in `app/package.json`), imported with a
  `.js` extension: `import { database } from '#lib/server/db/index.js'`.
- `$env/*` is replaced: declare every variable in `app/src/env.ts` with `defineEnvVars`, import it
  from `$app/env/private`. A variable without `schema` is required at build and start; use
  `building` from `$app/env` in the schema to require it only at start.
- `ServerInit` comes from `@sveltejs/kit/hooks`. adapter-node awaits `init` before it listens.
- adapter-node 6 has no `ORIGIN` variable: the origin is `paths.origin` from the config, else
  derived per request with protocol `https` unless `PROTOCOL_HEADER` names a header. Form POSTs
  over plain `http` therefore fail the CSRF check; test locally with
  `PROTOCOL_HEADER=x-forwarded-proto` and `X-Forwarded-Proto: http`.

## Runtime

- Node 24: `node:sqlite` with FTS5 is built in; `node` loads `.ts` files directly (type
  stripping), which tests use to run code in child processes.
- The agent's Bash shell starts on Node 24.21.0 although nvm's `default` is 24.22.1. Before
  `npm`, `make build` or `make e2e`: `source ~/.nvm/nvm.sh && nvm use 24.22.1`; `npm ci` fails
  on `engine-strict` otherwise.

## Dependencies

- A new or updated dependency is at least two weeks old and pinned to an exact version; security
  fixes are the exception. The same holds for base images and images in examples.

## Trying things by hand

- Admin forms with curl: a POST without a body gets 415, send `-d ""`. Over plain `http` add
  `-H X-Forwarded-Proto:http -H Origin:<url>` (server with `PROTOCOL_HEADER=x-forwarded-proto`);
  `-H 'x-sveltekit-action: true'` returns the action result as JSON.
- MCP with curl needs `Accept: application/json, text/event-stream`, or the transport rejects the
  request.
- Stop a test server by the PID `ss -ltnp` shows for its port, not by `$!`, which is the PID of
  the wrapping shell or npm.
- `docker exec -it` needs a terminal; without one:
  `printf 'admin\n' | script -qec "docker exec -it <container> node scripts/reset-admin.ts" /dev/null`.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`; `make handbook`
  builds with `--strict`.

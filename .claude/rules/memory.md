# Project memory

Facts learned while building grimoire.

## SvelteKit 3

- The `$lib` alias is gone; it is `#lib` (from `imports` in `app/package.json`), imported with a
  `.js` extension: `import { database } from '#lib/server/db/index.js'`.
- `$env/*` is replaced: declare every variable in `app/src/env.ts` with `defineEnvVars`, import it
  from `$app/env/private`. A variable without `schema` is required at build and start; use
  `building` from `$app/env` in the schema to require it only at start.
- `ServerInit` comes from `@sveltejs/kit/hooks`. adapter-node awaits `init` before it listens.

## Runtime

- Node 24: `node:sqlite` with FTS5 is built in; `node` loads `.ts` files directly (type
  stripping), which tests use to run code in child processes.

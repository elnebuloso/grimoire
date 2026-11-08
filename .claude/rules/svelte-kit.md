# SvelteKit

## Creating projects and add-ons

- **Projects and add-ons come from the Svelte CLI `sv`**
  (https://svelte.dev/docs/cli/overview), never by hand: no `npm install` of Svelte, SvelteKit or
  an add-on, and no hand-written `svelte.config.js`, `vite.config.ts` or other boilerplate the CLI
  generates.
- **Run it with `npx`, at a pinned version** at least two weeks old, like any dependency:
  `npx sv@<version> …`; `npm view sv time` lists the releases.
- **Without prompts.** The agent's shell has no terminal, so every choice goes on the command line:
  - new project: `npx sv@<version> create --template minimal --types ts --no-add-ons --install npm <path>`
  - add-on: `npx sv@<version> add <addon>=<option>:<value>+<option>:<value> --install npm`, with
    all of the add-on's options set; `npx sv@<version> add --help` lists them and their defaults.
- **Afterwards, work with what it generated.** Configure in the files the CLI wrote rather than
  rewriting them, and pin the versions it added to `app/package.json` to exact ones, as the
  dependency rule in `memory.md` asks.

## SvelteKit 3

- The `$lib` alias is gone; it is `#lib` (from `imports` in `app/package.json`), imported with a
  `.js` extension: `import { database } from '#lib/server/db/index.js'`.
- `$env/*` is replaced: declare every variable in `app/src/env.ts` with `defineEnvVars`, import it
  from `$app/env/private`. A variable without `schema` is required at build and start; use
  `building` from `$app/env` in the schema to require it only at start.
- `redirect()` to another origin throws unless it names it:
  `redirect(303, url, { external: [origin] })`.
- Param matchers are not files in `src/params/`: they live in `app/src/params.ts`, declared with
  `defineParams` from `@sveltejs/kit/params`. A running dev server (also the agent environment)
  sees a new matcher only after a restart; until then every page answers 500
  `param_matcher_missing`.
- `goto` options: `replace` (not `replaceState`) and `reset: false` (instead of `keepFocus` and
  `noScroll`).

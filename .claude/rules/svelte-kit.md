# SvelteKit

- **Projects and add-ons come from the Svelte CLI `sv`**
  (https://svelte.dev/docs/cli/overview), never by hand: no `npm install` of Svelte, SvelteKit or
  an add-on, and no hand-written `svelte.config.js`, `vite.config.ts` or other boilerplate the CLI
  generates.
- **Run it with `npx`, at a pinned version** at least two weeks old, like any dependency:
  `npx sv@<version> …`; `npm view sv time` lists the releases. Switch Node first
  (`source ~/.nvm/nvm.sh && nvm use 24.22.1`).
- **Without prompts.** The agent's shell has no terminal, so every choice goes on the command line:
  - new project: `npx sv@<version> create --template minimal --types ts --no-add-ons --install npm <path>`
  - add-on: `npx sv@<version> add <addon>=<option>:<value>+<option>:<value> --install npm`, with
    all of the add-on's options set; `npx sv@<version> add --help` lists them and their defaults.
- **Afterwards, work with what it generated.** Configure in the files the CLI wrote rather than
  rewriting them, and pin the versions it added to `app/package.json` to exact ones, as the
  dependency rule in `memory.md` asks.

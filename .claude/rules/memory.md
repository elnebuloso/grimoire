# Project memory

Facts learned while building grimoire. What nearly every task needs is here; the rest is in
`.claude/memory/`. Read the file before working in its area:

| File | Read before |
|---|---|
| `.claude/memory/sveltekit-server.md` | hooks, login, OIDC, CSRF, adapter-node or a `csr = false` page |
| `.claude/memory/runtime.md` | the image, child processes or code in `scripts/` |
| `.claude/memory/trying-by-hand.md` | curl, the Playwright MCP browser, `docker exec` or the agent database |
| `.claude/memory/ui.md` | messages, components or stories |
| `.claude/memory/database.md` | a schema change, `/setup`, export or import |
| `.claude/memory/releases-and-handbook.md` | a release or a page in `docs/handbook/` |

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

## Database

- A released migration is never edited; a schema change is a new numbered file.

## Git and Backlog

- Update with `git fetch origin && git rebase origin/main`. VS Code fetches in the background; a
  fetch at the same moment writes `main` twice into `.git/FETCH_HEAD`, and `git pull --rebase`
  stops with "Cannot rebase onto multiple branches", also with `origin main` named.
- `backlog task list --plain | head` crashes (Bun, "Error is not a constructor"); use `--limit`
  instead of `head`.

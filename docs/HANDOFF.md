# Handoff

## Where we stand

- **1.15.0 is released** with its release notes summary: sync errors name the page that was being
  parsed when indexing ran out of memory or past the deadline (TASK-409, Done). The handbook now
  names 512 MiB as the memory floor (`docker.md`, Memory and CPU limits).
- Nothing is in progress.

## Next: ask the owner

Open tasks, none started; work on them only on the owner's word:

- **Spikes TASK-393** (BM25 length normalisation), **TASK-394** (frontmatter fields to agents),
  **TASK-395** (what to fix next, from agent use), **TASK-396** (sources for the code an agent
  works on): only create/notes, no code.
- **Measuring wrong source picks** in practice needs the production `missed_queries` (owner's
  instance); offered a read-only script that prints numbers only, or a DB copy. Not decided.
- **Major upgrades, discussed only:** `croner` 11 first, then a spike whether
  `svelte-check`/`typescript-eslint` support TypeScript 7, `vitest` 5 not before ~16.11 and once
  `@storybook/addon-vitest` fits, `@inlang/paraglide-js` 3 last. `@types/node` stays 24.

## Decided on 2026-11-09, don't reopen

- **No page is skipped after an indexing crash** ("a documentation with skipped pages is half the
  truth"); the source stays on its old index until the page is split or memory raised. The 1 MB
  skip (`MAX_PAGE_BYTES`) stays.
- **No own heap limit for the indexing child:** Node 24 already sizes the default heap to about
  half the cgroup limit (measured in `node:24-trixie-slim`: 512m → 259 MB, 1g → 560 MB), so from
  512 MiB on the child dies alone (`SIGABRT`). Below that the kernel kills first; on Kubernetes
  ≥ 1.28 with cgroup v2 the whole container. Any future heap limit may only lower, never raise
  Node's default.

## Watch out

- **The page file** (`page-log.ts`): one JSON string per line, `<checkout>.pages` next to the
  checkout, emptied after parsing, removed with the checkout. A file, not IPC: queued IPC
  messages are lost when the child dies. Stand-ins in `sync.spec.ts` write that JSON format.
- **The named page is where memory or time ran out, not proven guilty:** `indexPages` keeps all
  parsed pages until the write, so memory grows over the whole source. Texts say "while indexing".
- **Search lookups run on rowid ranges per source** (`liveRanges`, `readableSources`,
  `occursIn` in `query.ts`), cached per source `index_generation`. Correct only because every
  write of pages/snippets goes through `replaceSourceIndex`, which raises the generation: a new
  write path must do the same.
- **The out-of-memory spec in `sync.spec.ts` uses a 0.74 MB page** on purpose: above
  `MAX_PAGE_BYTES` it would be skipped and the spec would stop testing an abort.
- **A new field on `IndexJob` must also go into `scripts/image-smoke.sh`**; run `make image &&
  make image-smoke` before pushing such a change.
- **Benchmark timing is noisy:** rerun one documentation with
  `cd app && BENCHMARK=1 TZ=UTC LANG=C npx vitest --run --project=benchmark -t "^fastapi "`.
- **`make test TEST="<file> -t '<two words>'"` breaks** on the space; filter by one word.
- **Playwright MCP screenshots** may only be written below the repository (`.playwright-mcp/`).
- **Probing search on one documentation:** a temporary `app/benchmark/probe.spec.ts` beats a full
  `make benchmark` (~11 min); delete it afterwards.
- **Not bugs, decided on purpose:** visitors see internal source names and stats on the start page
  (ADR 0012); "Did not fit" / "Not in any searched source" / "Found in other sources" come on top
  of the token budget; OIDC-only accounts need a password before linking or exporting; exclusions
  do not apply to includes; API keys need no password to create (TASK-406).
- **The agent instructions are at 995 of 999 characters** (`operations.spec.ts`).
- **The agent environment is stopped.** `make agent-start`, then `make agent-reset`.

## Working with the owner

- Replies in German, short. Source, commits, tasks, docs and release notes in English.
- Per task: targeted tests plus `make format`, local commit. Before a push: `make lint`,
  `make test`, `make e2e`; findings get their own commit.
- A fix to a feature not released yet is committed as that feature's `feat`, not `fix`.
- Push only on the owner's word. A `feat`/`fix`/`perf` push is a release: afterwards write the
  summary per `.claude/rules/release-notes.md` with `gh release edit`.
- `.claude/rules/agent-plugin-charter/` comes from a plugin, never edit it.

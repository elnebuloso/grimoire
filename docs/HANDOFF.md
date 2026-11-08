# Handoff

## Where we stand

- **The audit of 2026-11-08 is done and released in 1.14.0** (release notes summary written):
  TASK-398 … TASK-405, TASK-407, TASK-408 Done; TASK-406 dropped by the owner and archived.
- **TASK-392 decided: keep the ranking.** The two `i-doit-de` questions lose rank 1 to short
  on-topic sections that carry the last word in their title; no change.
- Nothing is in progress.

## Next: ask the owner

Open tasks, none started; work on them only on the owner's word:

- **TASK-409** (follow-up of TASK-404): name the page in `indexing ended with … before it
  finished` errors.
- **Spikes TASK-393** (BM25 length normalisation), **TASK-394** (frontmatter fields to agents),
  **TASK-395** (what to fix next, from agent use), **TASK-396** (sources for the code an agent
  works on): only create/notes, no code.
- **Measuring wrong source picks** in practice needs the production `missed_queries` (owner's
  instance); offered a read-only script that prints numbers only, or a DB copy. Not decided.
- **Major upgrades, discussed only:** `croner` 11 first, then a spike whether
  `svelte-check`/`typescript-eslint` support TypeScript 7, `vitest` 5 not before ~16.11 and once
  `@storybook/addon-vitest` fits, `@inlang/paraglide-js` 3 last. `@types/node` stays 24.

## Watch out

- **Search lookups run on rowid ranges per source** (`liveRanges`, `readableSources`,
  `occursIn` in `query.ts`), cached per source `index_generation`. Correct only because every
  write of pages/snippets goes through `replaceSourceIndex`, which raises the generation: a new
  write path must do the same.
- **`MAX_PAGE_BYTES` (1 MB) is not a memory guarantee:** table-heavy Markdown costs ~1 GB and
  25 s per MB to parse; on 512 MiB a page from ~0.4 MB can still abort indexing (TASK-409).
- **The out-of-memory spec in `sync.spec.ts` uses a 0.74 MB page** on purpose: above
  `MAX_PAGE_BYTES` it would be skipped and the spec would stop testing an abort.
- **Benchmark timing is noisy:** `fastapi` search p95 failed once at 2.3x while the machine was
  busy and passed when rerun alone. Rerun one documentation with
  `cd app && BENCHMARK=1 TZ=UTC LANG=C npx vitest --run --project=benchmark -t "^fastapi "`.
- **`make test TEST="<file> -t '<two words>'"` breaks** on the space; filter by one word.
- **Playwright MCP screenshots** may only be written below the repository (`.playwright-mcp/`,
  ignored), not to the scratchpad.
- **A new field on `IndexJob` must also go into `scripts/image-smoke.sh`**; run `make image &&
  make image-smoke` before pushing such a change.
- **Probing search on one documentation:** a temporary `app/benchmark/probe.spec.ts` beats a full
  `make benchmark` (~16 min); delete it afterwards, and never leave it in while the benchmark runs.
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

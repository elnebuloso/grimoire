# Handoff

## Where we stand

- **Search work of 2026-11-07 is released** in 1.10.1, 1.11.0 and 1.12.0: duplicate front matter
  keys accepted, more English stopwords, the `Not in any searched source: …` line with the words no
  source contains (also recorded under Queries without results, column "Words not found"), and a
  replacement for such words: the most common index term one edit away, else a prefix
  (`instalieren (searched as installieren)`). Each GitHub release has an operator summary on top.
- **The benchmark has eight documentations**, four English and four German (`kubernetes-de`,
  `i-doit-de`, `fastapi-de`, `odoo-wiki-de`), 30 questions each. How it works:
  `app/benchmark/README.md`.
- **Rejected, with numbers in the tasks:** bm25 weights, FTS5 `porter` (English-only, breaks the
  multilingual requirement), coordination, a per-page cap (TASK-370); a "no good match" threshold
  (TASK-369); trigram search in three variants (TASK-373). Read those notes before trying any of it
  again.
- **The backlog holds only four idea spikes**, priority Low, deliberately not started:
  TASK-374 Obsidian-style heading links, TASK-375 language-aware word stems, TASK-376 semantic
  search across languages, TASK-377 the language of each source for agents. Each ends with an owner
  decision; start one only when the owner asks.

## Next

Nothing is planned. When the owner picks up search again, start from the benchmark:

| 26 answerable each | rank 1 | within 3 | within 10 | MRR |
|---|---|---|---|---|
| kubernetes | 10 | 14 | 20 | 0.499 |
| mkdocs-material | 17 | 22 | 25 | 0.759 |
| fastapi | 10 | 16 | 24 | 0.540 |
| zensical | 16 | 20 | 22 | 0.700 |
| kubernetes-de | 21 | 23 | 23 | 0.842 |
| i-doit-de | 11 | 15 | 19 | 0.530 |
| fastapi-de | 8 | 17 | 24 | 0.503 |
| odoo-wiki-de | 22 | 23 | 25 | 0.872 |

Weakest kinds: questions in another language than the documentation, and German inflection of
words the index has in another form (`Phasen` vs `Phase`); both are what TASK-375 and TASK-376
are about.

## Watch out

- **Every search decision must keep multilingual documentation working** (owner, 2026-11-07).
  Measure on all eight documentations; a rule that only works for English is rejected.
- **`make benchmark` takes about 11 minutes**; up to 880 MB per documentation. Nothing else may run
  meanwhile: the time comparison is the only check on search speed.
- **Fast iteration on search:** a temporary vitest spec under `app/benchmark/` that indexes each
  documentation once into `app/.benchmark/dbs/` (`VACUUM INTO`) and runs `querySources` against
  those copies measures a change in seconds instead of 11 minutes. Never commit it, and move it
  out of `app/benchmark/` before `make benchmark`: vitest includes `benchmark/**`, runs it in
  parallel and skews the timings. Delete `app/.benchmark/dbs/` afterwards (several hundred MB).
- **Performance baseline:** machine-bound (4 cores here), updated with 1.12.0 because the
  replacement lookup does more work. `make benchmark-update` rewrites it every time: revert
  `*.performance.json` unless the change is meant to move it.
- **The agent instructions are at 995 of 999 characters** (`operations.spec.ts` allows under 250
  tokens = 4 characters each). Anything new needs something cut.
- **The list "Queries without results" now also holds queries with hits** whose words partly occur
  in no source; and a corrected word can give an unanswerable question hits (the line names the
  correction). Both are intended.
- **Fixture repository:** the vendored copies stay byte-identical (`vendor/.gitattributes`
  `* -text`); push it over SSH (in `memory.md`). `fastapi-de` has no `mkdocs.yml` upstream, so no
  `nav`; `i-doit`'s config lies at `vendor/i-doit/mkdocs.yml`, moved from `config/de/`;
  `odoo-wiki-de` excludes its `VENDOR.md` through `exclusions` in `app/benchmark/documentations.ts`.
- **Change questions and search code in separate commits**, so each commit's effect on the
  numbers stays readable. Expected IDs are snippet IDs: a heading merged into its parent has none.
- **Restart the dev server after pulling sync changes**: an old server against a newer indexing
  worker fails every sync with "indexing ended with exit code 1" (in `memory.md`).
- **Not re-verified:** the handbook's backup restore command (`docs/handbook/database.md`) with
  the image since it starts through `tini`.
- **The agent environment is stopped.** `make agent-start`, then `make agent-reset`.

## Working with the owner

- Replies in German; source, commits, tasks and docs in English.
- When the owner hands over a whole run ("go", "entscheide du"), decide and record the decision
  and its reason in the task notes; ask only for pushes, new follow-up tasks, deletions and
  agent-visible behaviour changes.
- Per task: targeted tests plus `make format`, then a local commit. Before a push: `make lint`,
  `make test`, `make e2e`; what they find is a commit of its own, then all three again.
- Commit and push only on the owner's word. A push of `feat`/`fix` commits to `main` is a
  release: say so before pushing, and after it add the operator summary with `gh release edit`.
  A fix of something not yet released is no `fix`.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

# Benchmark

`make benchmark` answers one question: **what did this change do to the index and the search?**
It indexes eight real documentations, four in English and four in German, asks 240 questions,
and compares everything with a stored baseline. It does not judge whether a change is good. It shows what changed, and a person decides.

## The principle

1. **Fixed input.** The same eight documentations on every run. They are copies, not the upstream
   repositories, pinned by one commit of the fixture repository.
2. **A baseline in the repository.** The results of the last accepted state, in
   `baseline/`.
3. **Every run compares with the baseline.** Any difference in the index or the search fails the
   run and is shown as a diff, an improvement just like a regression.
4. **An intended change becomes the new baseline, on purpose.** `make benchmark-update` writes the
   new results; they are committed together with the code that caused them. From then on, every
   run compares with them.

So the baseline never moves by itself, and the git history of `baseline/` shows, change by change,
what each change did.

## The eight documentations

| Name | Pages | Why it is here |
|---|---|---|
| `kubernetes` | 2,520 | very large: time, memory, search over much text; Hugo syntax grimoire does not know |
| `mkdocs-material` | 85 | uses almost every MkDocs extension: admonitions, tabs, snippets, attributes |
| `fastapi` | 156 | code-heavy, long tutorials, typical developer questions |
| `zensical` | 57 | the second site generator grimoire supports |
| `kubernetes-de` | 147 | the German pages of the same Kubernetes commit: Hugo, German text |
| `i-doit-de` | 725 | German product documentation, large, MkDocs Material with many extensions |
| `fastapi-de` | 125 | the German translation of the FastAPI pages: questions compare across languages |
| `odoo-wiki-de` | 930 | German Zensical site; many short pages, template expressions grimoire does not know |

The German four show what a change to the search does to documentation in another language than
English; every search decision has to keep it working.

They live in `vendor/` of [grimoire-fixture-docs](https://github.com/elnebuloso/grimoire-fixture-docs),
each with its license and a `VENDOR.md` naming the upstream commit and what was changed. Which
commit of the fixture repository is read, and the source path of each documentation, is in
`documentations.ts`.

## What is compared

Three files per documentation in `baseline/`:

| File | Holds | Compared |
|---|---|---|
| `<name>.index.json` | every snippet ID, the number of pages, snippets and tokens, the dead links, the sync warnings | exactly |
| `<name>.search.json` | for each question the rank of the expected section, and the summary | exactly |
| `<name>.performance.json` | indexing time, peak memory of the indexing process, search answer time (median and 95th percentile) | fails only beyond twice the baseline |

The summary in `<name>.search.json`, for the questions that have an answer:

- `rank1`: the expected section is the first hit;
- `within3`, `within10`: it is among the first 3 or 10 hits;
- `meanReciprocalRank`: the average of 1 / rank (rank 1 counts 1, rank 2 counts 0.5, not found
  counts 0), between 0 and 1, higher is better;
- `unanswerableWithHits`: questions with no answer in the documentation that still got hits.

Time and memory are never the same twice on a shared machine, so they are the median of three
indexing runs and five search passes, and only a gross regression fails. They depend on the
machine: the file names the number of cores it was measured on. Update the baseline on the same
machine each time.

## Working with it

**When to run it:** before a release, and after a change to parsing, sync or search. It is not
part of `make test` or CI. A full run takes about 11 minutes.

**After a change:**

1. `make benchmark`.
2. Passes: nothing in the index or the search changed.
3. Fails: read the diff. Examples:
   - `"ci/build-status"` → `"ci/build"`: an ID moved; agents that stored the old one get "not found".
   - `"rank 7 | long | How do I …"` → `"rank 1 | …"`: a question improved.
   - `"meanReciprocalRank": 0.449` → `0.512`: the search as a whole improved.
4. Intended and worth it: `make benchmark-update`, then commit the changed `baseline/` files with
   the code change, and say in the commit message what improved.
5. Not intended: fix the code; the baseline stays.

**A change to the search is worth keeping** when the summary gets better and no documentation
loses more than one question; that some questions move down is normal.

## Questions

`questions/<name>.json`, 30 per documentation: short and precise, long and wordy, German
about English docs and English about German docs, with typos, quoting an error or a command, a term only in code, and a few with
no answer at all. Each names the section(s) that answer it, chosen by reading the documentation,
not by what grimoire finds, and a note why.

To change a question or add one: edit the file, check the expected ID exists in
`baseline/<name>.index.json`, run `make benchmark-update`, and commit both. Changing questions
changes the numbers; do it in a commit of its own, not together with a search change, so the
effect of each stays readable.

## Updating the documentations

Rarely, and as a whole: copy the new upstream state into `vendor/` of the fixture repository,
update its `VENDOR.md`, push, put the new commit into `documentations.ts`, run
`make benchmark-update`, check that the expected IDs of the questions still exist, and commit.
Numbers before and after such an update are not comparable.

## Files

| Path | What |
|---|---|
| `documentations.ts` | fixture commit, the eight source paths and their exclusions |
| `fixture.ts` | clones the fixture repository once into `app/.benchmark/` (not committed) |
| `benchmark.spec.ts` | indexes, asks, measures, compares |
| `questions/` | the questions with their expected sections |
| `baseline/` | the accepted results |

The first run needs the network to clone the fixture repository; after that none. Deleting
`app/.benchmark/` makes the next run clone again.

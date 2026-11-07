---
id: TASK-371
title: 'Benchmark: add four German documentations, as many as the English ones'
status: To Do
assignee: []
created_date: '2026-11-07 10:09'
updated_date: '2026-11-07 10:14'
labels:
  - search
dependencies: []
references:
  - app/benchmark/documentations.ts
  - app/benchmark/README.md
priority: medium
type: task
ordinal: 433000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The benchmark (`make benchmark`, `app/benchmark/`) indexes four English documentations and asks German questions about them, but holds no non-English documentation. A search change that hurts German pages (a stopword list, a tokenizer, stemming) therefore shows no regression. The owner requires every search decision to keep multilingual documentation working (TASK-370).

Add one or more openly licensed German documentations as vendored copies in `grimoire-fixture-docs/vendor/` (license and `VENDOR.md` as for the others, byte-identical, `* -text`), each with a source path in `app/benchmark/documentations.ts` and a question file in `app/benchmark/questions/` written by reading the documentation: German questions of the existing kinds (short, long, typo, error, a term only in code, a few without answer), plus English questions about the German documentation. Prefer a site built with MkDocs or Zensical, and a size that keeps `make benchmark` well under its current time.

New vendored copies mean a new fixture commit in `documentations.ts` and a new baseline, in one commit; the README's table of documentations lists them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One or more German documentations are indexed by `make benchmark`, with license and `VENDOR.md` in the fixture repository
- [ ] #2 Each has a question file with German and English questions, expected IDs checked against its `*.index.json`
- [ ] #3 The baseline is updated in one commit with the new fixture commit; `app/benchmark/README.md` lists the new documentations
- [ ] #4 Four German documentations, or as many as can be found with an open license, each with the reason in the notes where one is missing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner (2026-11-07): if possible as many German documentations as English ones, so four. Where it fits, each mirrors the profile of an English one (very large; many MkDocs extensions; code-heavy with long tutorials; built with Zensical or a second site generator). If fewer than four openly licensed German documentations are found that fit, take the ones there are and name in the notes what was searched and why the rest is missing.

Candidates (2026-11-07):
- Context7 does not help: it has no language filter and indexes almost only English documentation.
- FastAPI `docs/de/docs` upstream: 125 pages (English 156), German translation of the same documentation, same license, MkDocs. Strong fit for the code-heavy profile; the same files as `vendor/fastapi/docs/en/docs`, so expected IDs map by path and English and German questions can be compared directly.
- Kubernetes `content/de` upstream (kubernetes/website): 147 pages, Hugo; much smaller than the English 2,519, so it fills the Hugo/large slot only in kind, not in size.
- Material for MkDocs and Zensical have no German translation upstream; the two slots for many MkDocs extensions and Zensical need German-native documentation, still to be found.
- The current fixture vendors only `en` of FastAPI and Kubernetes.
<!-- SECTION:NOTES:END -->

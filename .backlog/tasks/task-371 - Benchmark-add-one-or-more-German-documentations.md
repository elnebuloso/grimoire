---
id: TASK-371
title: 'Benchmark: add four German documentations, as many as the English ones'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-07 10:09'
updated_date: '2026-11-07 12:13'
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
- [x] #2 Each has a question file with German and English questions, expected IDs checked against its `*.index.json`
- [x] #3 The baseline is updated in one commit with the new fixture commit; `app/benchmark/README.md` lists the new documentations
- [x] #4 Four German documentations, or as many as can be found with an open license, each with the reason in the notes where one is missing
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

Chosen 2026-11-07 (owner said go): kubernetes-de (content/de of the vendored commit, 147 pages, Hugo), fastapi-de (docs/de/docs of the vendored commit, 125 pages; upstream has no German mkdocs.yml, so no nav), i-doit-de (i-doit Knowledge Base docs/de, 725 pages, MkDocs Material with many pymdownx extensions, CC BY-SA 4.0), odoo-wiki-de (Mint-System Odoo-Wiki, 930 pages, Zensical, AGPL-3.0). Found by GitHub code search for 'language: de' in mkdocs.yml and 'language = "de"' in zensical.toml, filtered by license and size; Context7 had nothing.
Fixture: commit 2ce2c00 in grimoire-fixture-docs, copies verified byte for byte against upstream; i-doit's config/de/mkdocs.yml lies at vendor/i-doit/mkdocs.yml (grimoire looks for the config in or above the source path), noted in its VENDOR.md. odoo-wiki-de excludes vendor/odoo-wiki/VENDOR.md, which lies inside its source path: documentations.ts got an optional 'exclusions', inserted like an admin's.
Index: no sync warnings. odoo-wiki-de has 394 dead links, 390 of them Obsidian-style anchors with the heading text (Settings E-Mail#E-Mail-Vorlagen%20anzeigen) that the upstream build script rewrites; grimoire does not resolve them. Whether grimoire should is a question for the owner, not part of this task.
Questions: 30 per documentation written by four agents from reading the pages, kinds as the English files with 'english' (English question about German docs) instead of 'german'; all expected IDs checked against the index.

First baseline (rank 1 / within 3 / within 10 / MRR of 26 answerable; unanswerable with hits): kubernetes-de 20/22/22/.806, 4; i-doit-de 10/14/18/.495, 4; fastapi-de 7/16/23/.466, 3; odoo-wiki-de 21/22/24/.834, 4. fastapi-de against the English fastapi (8/15/23/.476) is almost the same with the same questions translated: the German pages are searched as well as the English ones. English baselines unchanged. make benchmark now takes 11 minutes (668 s measured), peak memory per documentation at most 822 MB. AC #1 is checked once the fixture commit is pushed.
<!-- SECTION:NOTES:END -->

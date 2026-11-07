---
id: TASK-363
title: 'Benchmark: vendor four public documentations into grimoire-fixture-docs'
status: To Do
assignee: []
created_date: '2026-11-07 01:44'
labels:
  - ops
dependencies: []
references:
  - .claude/rules/agent-environment.md
priority: medium
type: task
ordinal: 425000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire gets a deterministic benchmark (see the dependent tasks). It must always run on the same four documentations that grimoire does not own, so they are copied once, at a fixed commit, into the fixture repository `/workspace/github.com/elnebuloso/grimoire-fixture-docs` (GitHub `elnebuloso/grimoire-fixture-docs`, the repository the agent environment already syncs, see `.claude/rules/agent-environment.md`), under a folder `vendor/`. Upstream repositories can move branches, rewrite or delete commits; a copy we own stays.

The four documentations, chosen for what they exercise (page counts of the Markdown in the docs folder, checked through the GitHub API on 2026-11-07):

| Folder | Upstream | Docs path | Pages | Generator | License | Why |
|---|---|---|---|---|---|---|
| `vendor/kubernetes` | `kubernetes/website` (branch `main`) | `content/en` | 2,520 | Hugo | CC-BY-4.0 | very large: time, memory, search over much text; Hugo shortcodes test that unknown syntax passes cleanly |
| `vendor/mkdocs-material` | `squidfunk/mkdocs-material` (`master`) | `docs` | 85 | MkDocs | MIT | uses almost every pymdownx extension: admonitions, tabs, snippets, attr_list |
| `vendor/fastapi` | `fastapi/fastapi` (`master`) | `docs/en` | 156 | MkDocs | MIT | code-heavy, long tutorials, typical developer questions |
| `vendor/zensical` | `zensical/docs` (`master`) | `docs` | 57 | Zensical (reads `mkdocs.yml`) | MIT | the second generator grimoire supports |

Rejected: Docker docs (Hugo, overlaps Kubernetes), Pydantic and uv (similar to FastAPI; much of Pydantic's API text is generated from code), Home Assistant (license unclear). The repository's own fixture docs (`zensical/docs`, `mkdocs/docs`) stay as they are for edge cases and are not part of the four.

Per documentation, copy the Markdown of the docs path, the site config (`mkdocs.yml`, `zensical.toml`; for Hugo nothing is needed) and the files the docs include (pymdownx snippets, e.g. FastAPI's `docs_src`), keep the paths relative to each other so includes resolve, and leave images and other binaries out. Each folder gets the upstream license file and a `VENDOR.md`: upstream URL, the commit SHA copied, the date, what was left out, and for CC-BY-4.0 the attribution and the note that the copy is modified. The existing paths and `README.md` of the fixture repository, which the agent environment relies on, must not change; add a section about `vendor/` to its README.

Agreed with the user on 2026-11-07. A page of benchmark results in the handbook and a version history (e.g. docs/benchmark.md) are explicitly out of scope for now; results live only as the baseline files in the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `vendor/kubernetes`, `vendor/mkdocs-material`, `vendor/fastapi` and `vendor/zensical` exist in grimoire-fixture-docs, each with the upstream license and a `VENDOR.md` naming upstream, commit SHA, date and what was left out
- [ ] #2 Includes inside each copy resolve within the copy (no include points outside its folder)
- [ ] #3 The attribution required by CC-BY-4.0 is in `vendor/kubernetes/VENDOR.md`
- [ ] #4 The agent environment syncs as before (`make agent-reset`: the fixture sources reach the state `.claude/rules/agent-environment.md` describes)
- [ ] #5 The commit of grimoire-fixture-docs that adds the copies is pushed, and its SHA is noted in this task
<!-- AC:END -->

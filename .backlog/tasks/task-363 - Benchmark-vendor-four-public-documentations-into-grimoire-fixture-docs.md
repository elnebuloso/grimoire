---
id: TASK-363
title: 'Benchmark: vendor four public documentations into grimoire-fixture-docs'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 01:44'
updated_date: '2026-11-07 02:02'
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
- [x] #1 `vendor/kubernetes`, `vendor/mkdocs-material`, `vendor/fastapi` and `vendor/zensical` exist in grimoire-fixture-docs, each with the upstream license and a `VENDOR.md` naming upstream, commit SHA, date and what was left out
- [x] #2 Includes inside each copy resolve within the copy (no include points outside its folder)
- [x] #3 The attribution required by CC-BY-4.0 is in `vendor/kubernetes/VENDOR.md`
- [x] #4 The agent environment syncs as before (`make agent-reset`: the fixture sources reach the state `.claude/rules/agent-environment.md` describes)
- [x] #5 The commit of grimoire-fixture-docs that adds the copies is pushed, and its SHA is noted in this task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shallow sparse clones of the four upstreams at their branch tips; record the commit SHAs
2. Copy only Markdown of the docs path plus the site config, include targets and license into grimoire-fixture-docs/vendor/<name>/; images and binaries left out
3. VENDOR.md per folder (upstream, SHA, date, source path, copied, changed; CC BY 4.0 attribution for Kubernetes); README section on vendor/
4. vendor/.gitattributes `* -text` so CRLF pages stay byte for byte
5. Commit, push, check the agent environment
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Upstream commits: kubernetes/website e136b827da7537cdf5ec2a497335e6b42962a3a6, squidfunk/mkdocs-material 7590e14da9fcab7c81bb2496a4c3389f0901988e, fastapi/fastapi 1ca09c13584ca45aa0921e5e40b31d49c5e3135a, zensical/docs 48f313ef7f81db54fbbe8d58456d6875af78919f.
- Includes: the only real include in the four is `includes/languages.html` in Zensical; its path was prefixed with `vendor/zensical/` (noted in VENDOR.md). The `;--8<-- ".browserslistrc"` lines in Material and Zensical are escaped examples. FastAPI embeds code with its own `{* … *}` syntax, which grimoire keeps as text, so docs_src was not copied.
- Some Kubernetes pages have CRLF line endings; the git config here has core.autocrlf=input, which would have converted them, hence `vendor/.gitattributes` with `* -text` (checked: the staged blob is byte-identical).
- Size: 34 MB, 2,832 files. grimoire-fixture-docs commit 858ac43f5d7d766ebd9e201b1761f3e989973d79, pushed to main.
- Agent environment after `make agent-reset`: platform-docs 4 pages / 3 dead links, billing-docs 3 / 3, billing-archive the expected path error, platform-next untouched. A dev server started before TASK-348 failed every sync with exit code 1 (its sync.ts sent no serverPid to the new worker); a restart fixed it.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The four documentations (Kubernetes, Material for MkDocs, FastAPI, Zensical) are copied at fixed upstream commits into grimoire-fixture-docs/vendor/, Markdown, site configs, include targets and licenses only, byte for byte (CRLF kept through .gitattributes), each with a VENDOR.md naming upstream, commit, date, source path, what was left out and the one changed include path; the Kubernetes copy carries the CC BY 4.0 attribution. Pushed as 858ac43; the agent environment syncs its fixture sources as before.
<!-- SECTION:FINAL_SUMMARY:END -->

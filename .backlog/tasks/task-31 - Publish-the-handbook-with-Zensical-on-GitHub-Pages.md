---
id: TASK-31
title: Publish the handbook with Zensical on GitHub Pages
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T22:27:00Z'
updated_date: '2026-10-28T22:33:00Z'
labels: []
milestone: m-0
dependencies: []
priority: medium
type: docs
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The handbook in `docs/handbook/` is written to be published on its own, but nothing publishes it yet. It should live at https://elnebuloso.github.io/grimoire/ for operators and agents, with an `llms.txt` so agents can read it directly. Decided with the user: Zensical instead of MkDocs. The user publishes another project the same way with MkDocs (`mkdocs gh-deploy` in https://raw.githubusercontent.com/elnebuloso/zilpzalp/refs/heads/main/.github/workflows/docs.yml); take the trigger setup from there (push to `main` limited to the docs paths, plus `workflow_dispatch`). Third-party projects report that Zensical generates `llms.txt` natively since 0.0.67 from the `llmstxt` plugin configuration; not verified here. If Zensical cannot produce it, stop and ask instead of switching to MkDocs. The handbook is also a real Zensical source for grimoire itself, which indexes exactly this syntax.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A Zensical configuration builds the pages in `docs/handbook/`; `zensical build --strict` passes
- [x] #2 The Zensical version is pinned
- [x] #3 A workflow publishes the site to GitHub Pages at https://elnebuloso.github.io/grimoire/ on a push to `main` that changes the handbook or its configuration, and when started by hand
- [x] #4 The published site serves `llms.txt` at its root, listing the handbook pages
- [x] #5 A `make` target builds the site locally
- [x] #6 Verified after one run on GitHub: the site and its `llms.txt` are reachable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. `zensical.toml` at the repo root (docs_dir `docs/handbook`; Zensical requires it inside the project root), llmstxt plugin with one Handbook section.
2. `docs/handbook/index.md` as home page, without it the site root is a 404.
3. `make handbook` builds with `uvx --python 3.12 zensical==0.0.70 build --strict` into `site/` (ignored).
4. `.github/workflows/handbook.yml`: push to main on handbook/config/workflow changes plus workflow_dispatch; setup-uv, `make handbook`, upload-pages-artifact, deploy-pages.
5. User enables GitHub Pages with source "GitHub Actions"; one run; check site and llms.txt.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Zensical 0.0.70 (newest at least two weeks old; 0.0.72 has a reported privacy-plugin bug) generates llms.txt natively from `[project.plugins.llmstxt]` in zensical.toml; verified locally: `make handbook` passes --strict and writes site/llms.txt with the site description and both pages. Without `--python`, uv built zensical from source (needs Rust) instead of using the abi3 wheel, so the target pins Python 3.12. Added `docs/handbook/index.md` as home page. Deployment uses actions/deploy-pages, so GitHub Pages must be set to source "GitHub Actions" in the repository settings (Pages was not enabled yet).

First run on GitHub after the push (triggered by the handbook change): https://elnebuloso.github.io/grimoire/, /database/, /llms.txt and the Markdown copy /index.md all answer 200; llms.txt lists both pages.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The handbook in docs/handbook is published at https://elnebuloso.github.io/grimoire/ with Zensical 0.0.70: zensical.toml at the repo root with the native llmstxt plugin, a new home page docs/handbook/index.md, `make handbook` (uvx, Python pinned to 3.12) building into site/, and .github/workflows/handbook.yml deploying via actions/deploy-pages on handbook changes on main or by hand. GitHub Pages is set to source "GitHub Actions". Verified locally (--strict) and on the live site, including llms.txt.
<!-- SECTION:FINAL_SUMMARY:END -->

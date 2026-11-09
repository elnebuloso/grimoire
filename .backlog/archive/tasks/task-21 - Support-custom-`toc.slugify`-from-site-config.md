---
id: TASK-21
title: Support custom `toc.slugify` from site config
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T19:57:00Z'
updated_date: '2026-10-29 22:26'
labels:
  - parsing
milestone: m-0
dependencies:
  - TASK-5
  - TASK-7
documentation:
  - docs/concept.md
priority: low
type: enhancement
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Version 1 builds anchors like Python-Markdown's default `toc` slugify, which MkDocs and Zensical both use. A site can swap the slug function via `toc.slugify` in `mkdocs.yml` or `zensical.toml` (typically `pymdownx.slugs.slugify` with options such as `case`); its rendered anchors then differ from grimoire's IDs, and links between the two no longer match.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The sync reads `toc.slugify` from `mkdocs.yml` or `zensical.toml` of the repository when present
- [x] #2 `pymdownx.slugs.slugify` and its options are supported; anchors match the rendered site
- [x] #3 An unknown slug function falls back to the default and is reported as a warning on the source
- [x] #4 Tests compare against anchors produced by the configured slug function
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep `!!python/name:` and `!!python/object/apply:` tags when reading `mkdocs.yml`, in the `{ object, kwds }` shape `zensical.toml` uses
2. `parsing/slugs.ts`: Python-Markdown `slugify`/`slugify_unicode`, `pymdownx.slugs.slugify` with `case`, `percent_encode`, `normalize`; pick the configured one from the `toc` settings, honouring `separator`
3. Pass it from `indexCheckout` into `chunkPage`; unknown function -> default + warning
4. Tests with expected values from the Python implementations
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Expected slugs in `slugs.spec.ts` were produced by Python-Markdown and pymdown-extensions 12.3 in a scratch venv. Python's Unicode `\w` is ported as `[\p{L}\p{N}_]` (no combining marks, which matters for `normalize: NFD`). `case: fold` uses upper-then-lower case in JavaScript, which matches `casefold` for the tested texts (e.g. `ß` -> `ss`) but is not identical for every character.

Also honours `toc.separator`, since every slug function takes it; without it anchors would still differ for such sites.

`make lint`, `make test` (281), `make e2e`, `make handbook` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Heading IDs follow the slug function the site configures under `toc` in `mkdocs.yml` (`!!python/name:` / `!!python/object/apply:`) or `zensical.toml` (`slugify = { object, kwds }`): `pymdownx.slugs.slugify` with all its options, `markdown.extensions.toc.slugify` and `slugify_unicode`, plus `toc.separator`. Any other function keeps the default and shows a warning at the source. Tests compare against values produced by the Python implementations. Known limit: `case: fold` approximates Python's `casefold`. Existing sources get the new IDs on their next sync.
<!-- SECTION:FINAL_SUMMARY:END -->

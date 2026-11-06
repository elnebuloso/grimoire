---
id: TASK-284
title: 'CI: build the handbook in the check job'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:58'
updated_date: '2026-11-06 18:16'
labels:
  - ops
dependencies: []
priority: medium
type: chore
ordinal: 346000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`make handbook` builds with `--strict`, so a page missing from `nav` in `zensical.toml` fails. The `check` job in `.github/workflows/ci.yml` does not run it; `handbook.yml` is called only after `release` has tagged a version (`if: needs.release.outputs.released`). A pull request that breaks the handbook passes and is merged; the Pages deploy fails only after the next release, and the published handbook stays one release behind the image. A `docs:` merge releases nothing, so the failure waits silently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The `check` job runs `make handbook` (with `astral-sh/setup-uv` pinned as in `handbook.yml`) and fails on a strict-build error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. The check job sets up uv (astral-sh/setup-uv@v10.3.0, as handbook.yml) and runs make handbook after make lint
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Checked locally: --strict fails on a broken link (exit 2, 'Aborted because --strict flag is set') but not on a page missing from nav, unlike the task text and memory.md assumed (zensical 0.0.70). The CI step still catches broken links before a merge; memory.md now says nav must be checked by hand.
- Not run in GitHub Actions: nothing is pushed in this run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CI's check job now builds the handbook with make handbook (uv set up as in handbook.yml), so a strict-build error fails a pull request instead of the Pages deploy after the next release. Locally verified: a broken link fails the strict build; a page missing from nav does not, which is now noted in memory.md.
<!-- SECTION:FINAL_SUMMARY:END -->

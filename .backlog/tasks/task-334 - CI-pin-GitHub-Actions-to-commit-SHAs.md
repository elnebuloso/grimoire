---
id: TASK-334
title: 'CI: pin GitHub Actions to commit SHAs'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-06 22:05'
updated_date: '2026-11-06 22:40'
labels:
  - ops
dependencies: []
references:
  - .github/workflows/ci.yml
  - .github/workflows/handbook.yml
priority: medium
type: chore
ordinal: 396000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.github/workflows/ci.yml` and `.github/workflows/handbook.yml` use third-party actions by version tag (`actions/checkout@v7.0.1`, `actions/setup-node@v7.1.0`, `astral-sh/setup-uv@v10.3.0`, `actions/upload-pages-artifact@v5.0.0`, `actions/deploy-pages@v5.0.1`). TASK-176 pinned them to exact version tags; a tag can still be moved by its owner or an attacker who controls the action's repository. The moved code would run in the handbook job (`pages: write`, `id-token: write`, can publish any content as the project's Pages site) and in the release job (`contents: write`, after `docker login` has written the Docker Hub credentials). There is no dependabot or renovate config.

The project rule (`.claude/rules/memory.md`, Dependencies) asks that GitHub Actions are pinned and at least two weeks old; SHA pins keep that and make the pin immutable.

Suggested fix: `uses: owner/action@<40-character commit SHA> # v7.0.1` for every action, the SHA of the tag currently used (`gh api repos/<owner>/<action>/git/ref/tags/<tag>`, dereferencing annotated tags).

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every third-party `uses:` in `.github/workflows/` names a full commit SHA with the version as a comment
- [x] #2 Each SHA is the commit of the version tag used before
- [ ] #3 CI runs green with the pinned actions
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Resolve each version tag in use to its commit SHA with gh api (annotated tags dereferenced) and check the commit exists
2. Pin every third-party uses: in ci.yml and handbook.yml as <sha> # <tag>
3. Note the rule in .claude/rules/memory.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- All five tags are lightweight tags; the SHAs were checked with gh api repos/<action>/commits/<sha>.
- Workflow YAML parses. AC #3 (CI green) can only be checked after the push; the task stays In Progress until then.
<!-- SECTION:NOTES:END -->

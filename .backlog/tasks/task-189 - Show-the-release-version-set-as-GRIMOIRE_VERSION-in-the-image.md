---
id: TASK-189
title: 'Show the release version, set as GRIMOIRE_VERSION in the image'
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 22:30'
updated_date: '2026-10-30 23:09'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 251000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the user: the current release version is available as an environment variable and shown in the footer next to "grimoire".

Agreed with the user:
- Variable `GRIMOIRE_VERSION`: the version of the product, not a setting of the instance. Declared in `app/src/env.ts` with `defineEnvVars`, optional, default `0.0.0` (development: `make dev`, tests, agent environment).
- The image carries it: in the final stage of `Dockerfile` `ARG GRIMOIRE_VERSION=0.0.0` and `ENV GRIMOIRE_VERSION=$GRIMOIRE_VERSION`. `make image` passes it as `--build-arg`; `.releaserc.json` calls `make image GRIMOIRE_VERSION=${nextRelease.version}` in `prepareCmd`, so the pushed image `<repo>:<version>` carries its own version.
- One source for the version: the MCP server reports `GRIMOIRE_VERSION` as `serverInfo.version` instead of `version` from `app/package.json` (`app/src/lib/server/agent/mcp.ts`); nothing else reads the version from `package.json` any more.
- Footer: "grimoire" followed by the version, in the same quiet style (`app/src/routes/+layout.svelte`, `docs/DESIGN.md`). A release version links to its release notes, `https://github.com/elnebuloso/grimoire/releases/tag/v<version>` (tag format `v${version}` from `.releaserc.json`); `0.0.0` is shown without a link.
- `make image-smoke` checks that the image built with a version reports it.
- Operator handbook (`docs/handbook/docker.md`): the image sets `GRIMOIRE_VERSION` itself; operators do not set it. Not listed as a setting in `app/.env.example`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Without `GRIMOIRE_VERSION` the app runs with `0.0.0`, and the footer shows "grimoire 0.0.0" without a link
- [x] #2 An image built by `make image GRIMOIRE_VERSION=1.2.3` has `GRIMOIRE_VERSION=1.2.3` in its environment, shows "grimoire 1.2.3" in the footer linking to the release notes of `v1.2.3`, and reports `1.2.3` as MCP `serverInfo.version`
- [x] #3 The release builds the image with the version semantic-release computes
- [x] #4 No code reads the version from `app/package.json` any more
- [x] #5 `make image-smoke` checks the version of the image
- [x] #6 Tests cover the default, a set version in the footer link and the MCP server version
- [x] #7 `docs/handbook/docker.md` says the image sets `GRIMOIRE_VERSION` and operators leave it alone; `docs/DESIGN.md` describes the version in the footer
- [x] #8 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. GRIMOIRE_VERSION in env.ts, default 0.0.0
2. Dockerfile ARG/ENV, make image --build-arg, .releaserc.json passes nextRelease.version to image and image-smoke
3. MCP serverInfo.version from GRIMOIRE_VERSION, package.json import removed
4. Footer: version next to grimoire, releaseNotesUrl() links releases, none for 0.0.0
5. Tests (release.spec, agent-api.spec, e2e with 1.2.3), smoke check, docs
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The e2e server runs as GRIMOIRE_VERSION=1.2.3 (playwright.config.ts), so e2e checks the linked state; the 0.0.0 state is covered by release.spec.ts and the agent environment.
- Checked by hand: make image GRIMOIRE_VERSION=1.2.3, docker inspect shows the variable, make image-smoke passes with 1.2.3 and fails with 9.9.9; the running container renders the footer link to releases/tag/v1.2.3.
- The local grimoire:latest is left built as 1.2.3.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GRIMOIRE_VERSION (default 0.0.0) is set in the image by the release (ARG/ENV, make image, .releaserc.json), reported as MCP serverInfo.version instead of package.json, and shown in the footer as "grimoire <version>", linked to the GitHub release notes except for 0.0.0. make image-smoke checks the version. Verified: release.spec, agent-api.spec, e2e footer link, image build and smoke with 1.2.3 (and a failing 9.9.9), container footer; make lint, make test (699), make e2e (23). The release path itself runs only in CI on the next release.
<!-- SECTION:FINAL_SUMMARY:END -->

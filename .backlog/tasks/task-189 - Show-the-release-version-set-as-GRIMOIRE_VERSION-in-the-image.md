---
id: TASK-189
title: 'Show the release version, set as GRIMOIRE_VERSION in the image'
status: To Do
assignee: []
created_date: '2026-10-30 22:30'
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
- [ ] #1 Without `GRIMOIRE_VERSION` the app runs with `0.0.0`, and the footer shows "grimoire 0.0.0" without a link
- [ ] #2 An image built by `make image GRIMOIRE_VERSION=1.2.3` has `GRIMOIRE_VERSION=1.2.3` in its environment, shows "grimoire 1.2.3" in the footer linking to the release notes of `v1.2.3`, and reports `1.2.3` as MCP `serverInfo.version`
- [ ] #3 The release builds the image with the version semantic-release computes
- [ ] #4 No code reads the version from `app/package.json` any more
- [ ] #5 `make image-smoke` checks the version of the image
- [ ] #6 Tests cover the default, a set version in the footer link and the MCP server version
- [ ] #7 `docs/handbook/docker.md` says the image sets `GRIMOIRE_VERSION` and operators leave it alone; `docs/DESIGN.md` describes the version in the footer
- [ ] #8 `make lint`, `make test` and `make e2e` pass
<!-- AC:END -->

---
id: TASK-36
title: Publish the Docker image to Docker Hub on release
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-29T00:14:00Z'
labels:
  - ops
milestone: m-0
dependencies:
  - TASK-35
priority: high
type: feature
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The image (`Dockerfile`, `make image`) is only built locally, so operators have to clone the repository and build it themselves. Every release should publish the matching image to Docker Hub, so an operator pulls the version that belongs to a release tag. The repository settings provide `DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD` and `DOCKERHUB_REPOSITORY` to GitHub Actions; the image name comes from `DOCKERHUB_REPOSITORY`, not from the workflow. Each release is tagged only with its version; no `latest` tag is pushed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After the release step on `main` created a release, the image is built and pushed to Docker Hub with the semver of that release tag (release `v0.2.0` → image version 0.2.0)
- [ ] #2 A push to `main` that creates no release pushes no image
- [ ] #3 Docker Hub login uses `DOCKERHUB_USERNAME` and `DOCKERHUB_PASSWORD`; neither appears in the repository or the logs
- [ ] #4 The image is pushed to the repository named by `DOCKERHUB_REPOSITORY`; no repository name is hard-coded
- [ ] #5 No `latest` tag is pushed
- [ ] #6 The handbook page for Docker (`docs/handbook/docker.md`) explains pulling the published image
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In job `release` of `.github/workflows/ci.yml`, after semantic-release: read the release version from a `v*` tag at `HEAD` (semantic-release tags the released commit in the checkout before pushing the tag); empty means no release.
2. Only with a version: `docker login` with `DOCKERHUB_USERNAME` and `DOCKERHUB_PASSWORD` via `--password-stdin`, `make image`, tag `grimoire:latest` as `$DOCKERHUB_REPOSITORY:<version>`, push only that tag.
3. `docs/handbook/docker.md`: pull the published image instead of building it; building stays for development.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD` and `DOCKERHUB_REPOSITORY` are repository secrets (read as `secrets.NAME`); `DOCKERHUB_REPOSITORY` is `elnebuloso/grimoire`. As a secret the repository name shows as `***` in the logs.

Image push added to job `release` in `.github/workflows/ci.yml`; `docs/handbook/docker.md` and `README.md` run `elnebuloso/grimoire:<version>`, building stays as `make image`.
Verified locally: the version step yields the version for a `v*` tag at `HEAD` and nothing for an untagged commit (semantic-release 25.0.9 runs `git tag <name> <ref>` in the checkout before pushing). `make handbook` builds strictly.
Not verified: the push to Docker Hub itself. The commits of this task are `ci`/`docs`/`test` and release nothing, so the first image appears with the next `feat` or `fix` on `main`.
<!-- SECTION:NOTES:END -->

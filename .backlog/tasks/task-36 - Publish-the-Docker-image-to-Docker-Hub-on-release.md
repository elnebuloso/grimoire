---
id: TASK-36
title: Publish the Docker image to Docker Hub on release
status: To Do
assignee: []
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-29T00:01:00Z'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
`DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD` and `DOCKERHUB_REPOSITORY` are repository secrets (read as `secrets.NAME`); `DOCKERHUB_REPOSITORY` is `elnebuloso/grimoire`. As a secret the repository name shows as `***` in the logs.
<!-- SECTION:NOTES:END -->

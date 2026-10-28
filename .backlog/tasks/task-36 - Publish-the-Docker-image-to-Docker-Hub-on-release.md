---
id: TASK-36
title: Publish the Docker image to Docker Hub on release
status: To Do
assignee: []
created_date: '2026-10-28T23:50:00Z'
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
The image (`Dockerfile`, `make image`) is only built locally, so operators have to clone the repository and build it themselves. Every release should publish the matching image to Docker Hub, so an operator pulls the version that belongs to a release tag. Credentials come from the environment variables `DOCKER_USERNAME` and `DOCKER_PASSWORD` (GitHub secrets). Open when picked up: the Docker Hub repository name, whether the image tag keeps the `v` of the release tag, and whether `latest` is moved along.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After the release step on `main` created a release, the image is built and pushed to Docker Hub with the semver of that release tag (release `v0.2.0` → image version 0.2.0)
- [ ] #2 A push to `main` that creates no release pushes no image
- [ ] #3 Docker Hub login uses `DOCKER_USERNAME` and `DOCKER_PASSWORD` from the environment; neither appears in the repository or the logs
- [ ] #4 The handbook page for Docker (`docs/handbook/docker.md`) explains pulling the published image
<!-- AC:END -->

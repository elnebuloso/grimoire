---
id: TASK-36
title: Publish the Docker image to Docker Hub on release
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T23:50:00Z'
updated_date: '2026-10-29T00:32:00Z'
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
- [x] #1 After the release step on `main` created a release, the image is built and pushed to Docker Hub with the semver of that release tag (release `v0.2.0` → image version 0.2.0)
- [x] #2 A push to `main` that creates no release pushes no image
- [x] #3 Docker Hub login uses `DOCKERHUB_USERNAME` and `DOCKERHUB_PASSWORD`; neither appears in the repository or the logs
- [x] #4 The image is pushed to the repository named by `DOCKERHUB_REPOSITORY`; no repository name is hard-coded
- [x] #5 No `latest` tag is pushed
- [x] #6 The handbook page for Docker (`docs/handbook/docker.md`) explains pulling the published image
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

Run 40792875159: semantic-release released nothing, the version step yielded nothing and the Docker step was skipped. `docs/handbook/docker.md` explains pulling the image; `make handbook` builds strictly. Pending: the first release, which proves the push, the tag and that no secret shows in the log.

Release run 40793837044 (empty `feat` commit on request): semantic-release published `v0.4.0`, the job logged in, built and pushed `0.4.0` (digest sha256:233e321b…). Docker Hub lists only the tag `0.4.0`, no `latest`. The log shows the repository and username as `***`; no secret value appears. `docker pull elnebuloso/grimoire:0.4.0` and a run of it served `/admin` (303 to setup) and printed the setup token.

Reordered on request: the image is pushed before the GitHub release, so a release only exists with its image. `@semantic-release/exec` 7.1.0 runs `make image`, `docker tag` and `docker push` as `prepareCmd`; semantic-release 25.0.9 runs prepare before it creates and pushes the tag and before `@semantic-release/github` publishes (`lib/index.js`). Docker login moved to a step before semantic-release. A failing push now stops the release before the tag. Remaining gap: if the tag is pushed but publishing the GitHub release fails, a rerun finds the tag and releases nothing; the release then has to be created by hand. Dry run verified the plugin loads via `npx --package`; the real prepare step is verified by the next release.

Verified with release `v0.5.0` (run 40794525958, empty `feat` commit on request): the log shows prepare (exec pushed `0.5.0`, digest sha256:88a49a23…) completing before "Created tag v0.5.0" and before `@semantic-release/github` published the release. Docker Hub lists `0.5.0` and `0.4.0`, no `latest`; `docker pull elnebuloso/grimoire:0.5.0` works.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every release now publishes its image to Docker Hub: job `release` in `.github/workflows/ci.yml` reads the version from the `v*` tag semantic-release put on `HEAD`, logs in with `DOCKERHUB_USERNAME`/`DOCKERHUB_PASSWORD` (repository secrets), runs `make image` and pushes only `$DOCKERHUB_REPOSITORY:<version>`, without `v` and without `latest`. `docs/handbook/docker.md` and `README.md` run `elnebuloso/grimoire:<version>`. Verified: a push without release skipped the step; release `v0.4.0` pushed `elnebuloso/grimoire:0.4.0`, which pulls and starts. A rerun on a released commit pushes the same tag again, which doubles as retry.
<!-- SECTION:FINAL_SUMMARY:END -->

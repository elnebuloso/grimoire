---
id: TASK-196
title: Bring the handbook and the README up to date for 1.0.0
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-30 23:27'
updated_date: '2026-10-31 13:38'
labels: []
milestone: m-1
dependencies:
  - TASK-194
  - TASK-209
documentation:
  - docs/handbook
  - README.md
priority: high
type: docs
ordinal: 258000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The 1.0.0 release publishes the handbook and puts the README in front of everyone who finds the project. Both grew task by task through the alpha, so pages may describe behaviour that has since changed, miss features added later, or still carry 0.x wording. They should describe the product as it ships in 1.0.0. The database page is restored separately by TASK-194, so this task builds on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every page in `docs/handbook/` matches the behaviour of the current code: no outdated steps, settings, error texts or limits, and no feature that users can reach is left undocumented
- [x] #2 The handbook follows `.claude/rules/agent-plugin-charter/handbook.md` (one reader per page, nothing the reader can already see, no build internals)
- [x] #3 `README.md` matches the 1.0.0 state: what grimoire is, how to run it and where the handbook is, with no 0.x-only notes left
- [x] #4 `make handbook` passes
- [x] #5 The Kubernetes section of `docs/handbook/docker.md` no longer reads as if an init container were required: grimoire updates the schema itself on start and only listens afterwards; a `MIGRATE_ONLY=true` init container is optional and only worth it where a liveness probe could restart the pod during a long schema update (no probes run in init containers), consistent with `docs/handbook/database.md`
- [x] #6 The section "Connecting agents" in `README.md` no longer says "Every request needs an API key": without a key, requests read and search the public sources; a key adds private sources (ADR 0004)
- [ ] #7 As the last step, `/charter:handbook-audit` runs over `docs/handbook/`; every finding is fixed or, where the user decides to leave it, recorded in the task with the reason
- [x] #8 The Kubernetes section of `docs/handbook/docker.md` shows a complete example that runs once its placeholders are filled in: Secret with `ENCRYPTION_KEY`, PersistentVolumeClaim (`ReadWriteOnce`), Deployment (`replicas: 1`, `strategy: Recreate`, uid 1000 via `fsGroup`, image pinned to a version) and Service, each hard requirement with a comment saying why; no Helm chart (decided with the user: a chart is a second product to version and publish, and can follow after 1.0.0 when operators ask for it)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify every handbook page and the README against the code (three parallel read-only checks, each finding re-checked in the code before use). 2. Rewrite the Kubernetes section with a complete manifest; init container optional. 3. README: drop 0.x status and dev note, public sources without key. 4. Pin examples to 1.0.0 (user's request). 5. make handbook, make lint. 6. Last: /charter:handbook-audit (run by the user).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checked against code; fixed: reset-link limit per client answers 429; key with all selected sources deleted reads public sources; missed queries stored up to 500 chars; ADDRESS_HEADER only fails login/setup/password forms (500); reset-admin logs the reset and new token at the next /manage request; ENCRYPTION_KEY also covers the token a source form carries; invalid ENCRYPTION_KEY/BASE_URL/SMTP_PORT stop the start; front matter description/tags are stored but never shown to agents; block splitting has no subheading preference and a single block over 800 tokens stays whole; added XFF_DEPTH, MCP tokens argument, toc slugify warning, Test connection decrypt message, path to Dead links. Removed wording about non-admin users and further admins: only the setup creates a user. Examples use elnebuloso/grimoire:1.0.0 at the user's request. Agent-reported 404 ID text mismatch was wrong (operations.ts:221 matches). Product issue found, not fixed: when every page is skipped before processing ("#" in name, symlink outside), the sync succeeds with an empty index that replaces the previous one (index-pages.ts:60 only throws when job.pages is non-empty).
<!-- SECTION:NOTES:END -->

---
id: TASK-64
title: Log in ECS format with a configurable log level
status: To Do
assignee: []
created_date: '2026-10-29 21:30'
labels:
  - ops
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
grimoire writes its log with plain `console.warn` and `console.error` calls: free text, one line or several, without timestamp or level as fields. Operators collect container logs centrally (Elasticsearch, OpenSearch, Loki), where such lines cannot be filtered by level or field, and stack traces split into separate entries. They want structured logs in the Elastic Common Schema (ECS) when running the container, readable text while developing locally, and a way to set how much is logged.

Today's log calls are in `app/src/lib/server/admin/auth.ts` (setup token, admin reset), `app/src/lib/server/sync/queue.ts` and the admin routes that start syncs. The `200 GET /` lines seen in development come from the Vite dev server, not from grimoire.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `LOG_FORMAT` selects the format: `ecs` writes one JSON object per line in ECS, `pretty` writes readable text for local development; default `ecs`, and `app/.env.example` sets `pretty`
- [ ] #2 `LOG_LEVEL` sets the lowest level that is written, one of `error`, `warn`, `info`, `debug`; default `info`
- [ ] #3 An unknown value of `LOG_FORMAT` or `LOG_LEVEL` stops the server at start with a message naming the variable and the value
- [ ] #4 Every ECS line has at least `@timestamp`, `log.level`, `message`, `ecs.version` and `service.name` (`grimoire`); an error carries `error.type`, `error.message` and `error.stack_trace` in the same line
- [ ] #5 Every message grimoire logs today goes through the logger, and so do unhandled errors of requests; nothing is written with `console` directly any more
- [ ] #6 The message with the setup token is written whatever `LOG_LEVEL` says, because the first start cannot be completed without it
- [ ] #7 Secrets never reach the log: neither access tokens nor Git URLs with credentials, in either format
- [ ] #8 Tests cover both formats, filtering by level, the fields of an error, and the rejection of unknown values
- [ ] #9 `LOG_FORMAT` and `LOG_LEVEL` are described with the other environment variables in the handbook and in `app/.env.example`
<!-- AC:END -->

---
id: TASK-64
title: Log in ECS format with a configurable log level
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 21:30'
updated_date: '2026-10-29 21:51'
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
- [x] #1 `LOG_FORMAT` selects the format: `ecs` writes one JSON object per line in ECS, `pretty` writes readable text for local development; default `ecs`, and `app/.env.example` sets `pretty`
- [x] #2 `LOG_LEVEL` sets the lowest level that is written, one of `error`, `warn`, `info`, `debug`; default `info`
- [x] #3 An unknown value of `LOG_FORMAT` or `LOG_LEVEL` stops the server at start with a message naming the variable and the value
- [x] #4 Every ECS line has at least `@timestamp`, `log.level`, `message`, `ecs.version` and `service.name` (`grimoire`); an error carries `error.type`, `error.message` and `error.stack_trace` in the same line
- [x] #5 Every message grimoire logs today goes through the logger, and so do unhandled errors of requests; nothing is written with `console` directly any more
- [x] #6 The message with the setup token is written whatever `LOG_LEVEL` says, because the first start cannot be completed without it
- [x] #7 Secrets never reach the log: neither access tokens nor Git URLs with credentials, in either format
- [x] #8 Tests cover both formats, filtering by level, the fields of an error, and the rejection of unknown values
- [x] #9 `LOG_FORMAT` and `LOG_LEVEL` are described with the other environment variables in the handbook and in `app/.env.example`
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Packages, pinned exactly, all older than two weeks: pino 10.4.0, @elastic/ecs-pino-format 1.5.0, pino-pretty 13.2.0, as dependencies (LOG_FORMAT=pretty must work in the image too).
2. app/src/lib/server/log.ts (plain node compatible, no #lib or $app imports): parseLogFormat (default ecs), parseLogLevel (default info), createLogger({ format, level }, destination) with ecsFormat({ serviceName: 'grimoire' }) or pino-pretty as a sync stream, a module logger replaced by configureLog, logAlways for the setup token through a child logger with its own level.
3. env.ts declares LOG_FORMAT and LOG_LEVEL; hooks init calls configureLog first; a handleError hook logs unknown request errors like SvelteKit's default did.
4. auth.ts imports '../log.ts' (scripts load it with plain node; the Dockerfile copies log.ts too); queue.ts and the routes that start syncs log through it; ESLint no-console for app/src outside tests.
5. .env.example and the agent environment use pretty; the e2e regex for the setup token works with JSON lines.
6. Tests in log.spec.ts, existing console spies moved to the logger, handleError test; handbook database.md, docker.md, admin.md.

7. Found while checking the built server: adapter-node writes 'Listening on …' (and SvelteKit a few internal errors) with console, which broke one JSON object per line. init now also calls routeConsoleToLog, which sends the console methods through the logger.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Packages: pino 10.4.0, @elastic/ecs-pino-format 1.5.0, pino-pretty 13.2.0, pinned, as dependencies. ecs-pino-format 1.5.0 is documented against pino 6; with pino 10 it produces the expected fields (log.spec.ts), ecs.version 8.10.0, service.name as a dotted key. pino-pretty runs as a sync stream, not a transport, because a transport worker loads its module from disk, which the bundled server does not ship.
auth.ts and queue.ts import '../log.ts' with its extension: scripts/ and a queue test load them with plain node. The Dockerfile copies log.ts next to auth.ts for reset-admin.ts.
Secrets: the logger adds no redaction of its own; sync errors are redacted where they arise (redact in sync/git.ts), and the messages logged now carry no URLs or tokens.
Verified: make lint, make test (409), make e2e (14, the setup token read from an ECS line), make handbook. Built server: LOG_LEVEL=error writes only the setup token line, LOG_LEVEL=info adds 'Listening on …', every line parses as JSON; LOG_FORMAT=pretty readable; LOG_LEVEL=verbose stops with 'LOG_LEVEL "verbose" is not one of error, warn, info, debug' (exit 1). Image: LOG_FORMAT=pretty readable in docker logs; scripts/reset-admin.ts still runs in the container. Agent environment logs pretty, including Vite's request lines.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
grimoire logs through pino. LOG_FORMAT=ecs (default) writes one JSON object per line in the Elastic Common Schema via @elastic/ecs-pino-format: @timestamp, log.level, message, ecs.version, service.name grimoire, and for errors error.type, error.message and error.stack_trace in the same line. LOG_FORMAT=pretty writes readable text through pino-pretty and is set in app/.env.example and the agent environment. LOG_LEVEL (error, warn, info, debug; default info) sets the lowest level; unknown values of either variable stop the start naming variable and value.

All log calls in app/src go through #lib/server/log.js, ESLint forbids console there, a handleError hook logs unexpected request errors like SvelteKit's default did, and init routes console to the logger so lines from SvelteKit and adapter-node (Listening on …) follow the format too. The setup token line is written whatever LOG_LEVEL says. Documented in database.md, docker.md (new Logs section) and admin.md.

Risk: @elastic/ecs-pino-format was last released in 2023 and is documented against pino 6; it works with pino 10 here, covered by log.spec.ts, which would catch a break on an update.
<!-- SECTION:FINAL_SUMMARY:END -->

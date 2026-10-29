---
id: TASK-61
title: Time zone of the instance for schedules and displayed times
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 20:16'
updated_date: '2026-10-29 20:29'
labels:
  - sync
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cron schedules are evaluated in the time zone of the server process, and the admin area shows raw UTC timestamps such as `2026-10-29T18:06:56.148Z`. An operator running grimoire in a container wants to set the time zone of the instance from outside. Schedules like `0 2 * * *` should then mean 2:00 local time, and the UI should show every date and time in that zone.

Decided with the user: one time zone for the whole instance, set by an environment variable; no time zone per source.

Not enough on its own: setting only the variable for the process. Pages hydrate in the browser, which would format dates in its own zone, so the app reads the zone itself and passes it explicitly to the cron evaluation and to every date formatting. The base image `node:24.22.1-trixie-slim` ships the zone data: `TZ=Europe/Berlin` works there for Node and `Intl` (checked with `docker run` when this task was created).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The time zone is set with the environment variable `TZ` as an IANA name (e.g. `Europe/Berlin`), declared in `app/src/env.ts`; without it, grimoire uses `UTC`
- [x] #2 An unknown time zone stops the server at start with a message naming the variable and the value
- [x] #3 `SYNC_SCHEDULE` and the schedules of sources are evaluated in that time zone, including the next check the source page shows, also across a daylight saving change
- [x] #4 The UI shows every date and time (last check, last sync, next check, oldest sync, API key created) in that time zone, formatted for the UI language, with the zone recognisable, and keeps the exact instant in the `datetime` attribute of `<time>`
- [x] #5 The same text is rendered on the server and after hydration in the browser, whatever time zone the browser is in
- [x] #6 Stored timestamps stay UTC; nothing in the database changes
- [x] #7 Tests cover schedules in a non-UTC zone (including a daylight saving change), formatting with a pinned zone and language, and the rejection of an unknown zone
- [x] #8 `TZ` is described with the other environment variables in the handbook and in `app/.env.example`, and the docs on schedules say they use it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Shared module app/src/lib/time-zone.ts (client-safe): parseTimeZone checks the name via Intl and returns it, UTC when unset; formatDateTime(iso, locale, timeZone) formats with Intl.DateTimeFormat and a short zone name.
2. Declare TZ in app/src/env.ts with parseTimeZone.
3. Pass TZ to every Cron: the isDue caller in sync/index.ts and the next check in the source page load, through a new nextRun in schedule.ts.
4. The root layout load returns timeZone, so every page has it in data; a DateTime component renders <time datetime> with the formatted text, used for oldest sync, last check, last sync, next check and API key created. DescriptionList accepts a snippet as value; apikeys_created_at loses its {date} placeholder.
5. Tests: schedules in Europe/Berlin across both daylight saving changes, formatting with pinned zone and locale, rejection of an unknown zone; stories updated.
6. Docs: handbook env tables and schedule section, app/.env.example.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Found while checking in the browser: api_keys.created_at holds SQLite's CURRENT_TIMESTAMP ('2026-10-29 20:24:12', UTC without a zone), which new Date() reads as local time, so server and browser showed different times. listApiKeys now returns it as an ISO instant via strftime; regression test in api-keys.spec.ts. Nothing in the database changes.
Verified in the agent environment with TZ=Europe/Berlin and a Playwright browser in America/New_York with German as language: /, /admin, /admin/api-keys and a source page render the same <time> texts on the server and after hydration (e.g. '29. Okt. 2026, 21:24 MEZ'), datetime keeps the UTC instant. TZ=Mars/Olympus stops the dev server and the built server (node build, exit 1) with 'TZ "Mars/Olympus" is not a known time zone'. make lint, make test (390), make build, make handbook pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
grimoire has one time zone for the whole instance, set with TZ (IANA name, default UTC, declared in app/src/env.ts). An unknown name stops the start with a message naming TZ and the value. SYNC_SCHEDULE, source schedules and the next check on the source page are evaluated in it through croner's timezone option, so 0 2 * * * means 2:00 local time in summer and winter. Every date in the UI (oldest sync, last check, last sync, next check, API key created) goes through a DateTime component that formats with Intl in that zone and the UI language, shows the zone (MEZ, GMT+1, UTC) and keeps the instant in datetime. The zone comes from the root layout data, so the hydrated page matches the server whatever zone the browser is in. API key creation times are now returned as UTC instants; before, they were read as local time. Stored timestamps are unchanged.

Covered by unit tests (both daylight saving changes, pinned formatting, unknown zone, created_at) and stories; checked by hand with a browser in another zone. Documented in database.md, docker.md, admin.md and app/.env.example.
<!-- SECTION:FINAL_SUMMARY:END -->

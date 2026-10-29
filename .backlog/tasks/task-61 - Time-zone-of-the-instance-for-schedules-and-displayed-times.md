---
id: TASK-61
title: Time zone of the instance for schedules and displayed times
status: To Do
assignee: []
created_date: '2026-10-29 20:16'
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
- [ ] #1 The time zone is set with the environment variable `TZ` as an IANA name (e.g. `Europe/Berlin`), declared in `app/src/env.ts`; without it, grimoire uses `UTC`
- [ ] #2 An unknown time zone stops the server at start with a message naming the variable and the value
- [ ] #3 `SYNC_SCHEDULE` and the schedules of sources are evaluated in that time zone, including the next check the source page shows, also across a daylight saving change
- [ ] #4 The UI shows every date and time (last check, last sync, next check, oldest sync, API key created) in that time zone, formatted for the UI language, with the zone recognisable, and keeps the exact instant in the `datetime` attribute of `<time>`
- [ ] #5 The same text is rendered on the server and after hydration in the browser, whatever time zone the browser is in
- [ ] #6 Stored timestamps stay UTC; nothing in the database changes
- [ ] #7 Tests cover schedules in a non-UTC zone (including a daylight saving change), formatting with a pinned zone and language, and the rejection of an unknown zone
- [ ] #8 `TZ` is described with the other environment variables in the handbook and in `app/.env.example`, and the docs on schedules say they use it
<!-- AC:END -->

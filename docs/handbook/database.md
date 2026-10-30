# Database

grimoire keeps everything in one SQLite file: projects, sources, API keys, and the pages and
snippets read from Git. Pages, snippets, links and the search index are rebuilt by every sync;
projects, sources and API keys exist only in this file.

## Configuration

| Variable | Meaning |
|---|---|
| `DATABASE_PATH` | Path of the SQLite file. Required; the server does not start without it. The file and its schema are created on first start. |
| `MIGRATE_ONLY` | With `true`, the server brings the schema up to date and exits without serving requests. |
| `TOKEN_ENCRYPTION_KEY` | Key encrypting the Git access tokens of all sources: 32 random bytes, base64-encoded. Required; the server does not start without it, also with `MIGRATE_ONLY`. |
| `SYNC_SCHEDULE` | When sources without their own schedule are checked for new commits: a cron expression with the five standard fields (minute, hour, day of month, month, day of week), in the time zone `TZ`. Default `*/5 * * * *`. An invalid expression stops the start. |
| `TZ` | Time zone of the instance, an IANA name such as `Europe/Berlin`. Schedules run in it, and the management area and the start page show every date and time in it, whatever time zone the browser is in. Default `UTC`. An unknown time zone stops the start. Stored timestamps stay UTC. |
| `INCLUDE_URL_ALLOW` | Origins pages may include files from by URL (`--8<-- "https://…"` with `url_download: true`), separated by commas, e.g. `https://docs.example.com,https://raw.githubusercontent.com`; `https://` only, nothing after host and port. grimoire requests nothing else for an include and follows no redirect. Default empty: no URL includes. An invalid entry stops the start. |
| `LOG_FORMAT` | `ecs` writes one JSON object per line in the Elastic Common Schema, for a log collector; `pretty` writes readable text, for local development. Default `ecs`. Any other value stops the start. |
| `LOG_LEVEL` | Lowest level that is written: `error`, `warn`, `info` or `debug`. Default `info`. Any other value stops the start. |

## Sync schedule

Every source is checked by its own cron expression, set in the management area, or by `SYNC_SCHEDULE`
when it has none — for example `0 * * * *` for a Git server that allows few requests, or
`0 6 * * 1-5` for a source that changes rarely. A check only asks the Git server for the branch
head; a source is cloned only when the branch moved.

Both read their times in the time zone `TZ`: with `TZ=Europe/Berlin`, `0 6 * * 1-5` means 6:00 in
Berlin, in summer and in winter time.

A sync turns the pages into snippets in a separate process and writes them in one transaction, so
grimoire keeps answering agents while a large source syncs; until the transaction commits, they
search the previous index. A check starts at most 15 seconds after its scheduled time. Up to four sources are checked at once
and one is cloned at a time; a server that does not answer within 30 seconds is skipped until the
next scheduled run and shows as error of the source. A run missed while grimoire was stopped is made
up once when it starts again. An invalid source schedule is shown as error of that source.

## Volume

Mount a directory as the volume, not the database file: SQLite writes two companion files next to
it, `<file>-wal` and `<file>-shm`, and all three must live in the same directory on the same
volume. With the volume at `/data`, set `DATABASE_PATH=/data/grimoire.db`. A missing directory is
created on start.

## Access tokens

The Git access token of every source is stored encrypted with `TOKEN_ENCRYPTION_KEY`; the
database file alone does not reveal it. Generate the key once and keep it with your other secrets:

```bash
openssl rand -base64 32
```

Keep the key for as long as the database: a backup restored with a different key still opens, but
every source fails to sync until its token is entered again. Never put the key next to the
database backups — together they reveal every token.

## One instance

Run exactly one grimoire process per database file. On Kubernetes that means `replicas: 1`,
`strategy: Recreate` and a `ReadWriteOnce` or `ReadWriteOncePod` volume. Do not put the file on
a `ReadWriteMany` volume or any other network file system: SQLite's locking is not reliable there,
and concurrent writers can corrupt the file.

## Schema updates

Releases before `1.0.0` are previews. A database written by one `0.x` release is not guaranteed
to work with a later one, and no update path between them is kept: when updating a `0.x`
installation, start the new release with a fresh database and enter projects, sources and API
keys again. The rest of this section applies from `1.0.0` on.

A new grimoire version updates the schema itself when it starts. Updates only go forward; each one
runs in its own transaction, and a failed update is rolled back and stops the start with an error
naming the migration.

To migrate before the application starts, run the same image as an init container with
`MIGRATE_ONLY=true` and the same `DATABASE_PATH`. Should the application start at the same time
anyway, both processes wait for each other and every update is applied once.

An older grimoire refuses to start on a database that a newer version has already updated.

## Backups and going back

There is no way to undo a schema update. To go back to an older grimoire version, restore the
backup taken before the update.

Take backups as a consistent copy, for example with the `sqlite3` command-line tool:

```bash
sqlite3 /data/grimoire.db ".backup /backup/grimoire.db"
```

A plain file copy of a running database can miss changes still in `<file>-wal`. Copying is safe
only while grimoire is stopped.

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
| `SYNC_INTERVAL_MINUTES` | How often every source is checked for new commits, in minutes. Default `5`. A check only asks the Git server for the branch head; sources are cloned only when it moved. Up to four sources are checked at once and one is cloned at a time; a server that does not answer a check within 30 seconds is skipped for that round and shows as error of the source. |

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

# Database

grimoire keeps everything in one SQLite file: projects, sources, API keys, and the pages and
snippets read from Git. Pages, snippets, links and the search index are rebuilt by every sync;
projects, sources and API keys exist only in this file.

## Configuration

| Variable | Meaning |
|---|---|
| `DATABASE_PATH` | Path of the SQLite file. Required; the server does not start without it. The file and its schema are created on first start. |
| `MIGRATE_ONLY` | With `true`, the server brings the schema up to date and exits without serving requests. |

SQLite writes two companion files next to the database, `<file>-wal` and `<file>-shm`. Keep all
three on the same volume.

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

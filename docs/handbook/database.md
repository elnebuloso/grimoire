# Database

!!! info "Prerequisites"
    - Reader: operator.
    - Required access: the volume at `/data`, and the secret store holding `TOKEN_ENCRYPTION_KEY`.

    New to grimoire? Read [Concepts](index.md) first.

grimoire keeps everything in one SQLite file. Sources, users, settings and API keys exist
only there; pages, snippets and links are read again from Git by the next sync of each source.

## Volume

Mount a directory, not the file: SQLite writes `<file>-wal` and `<file>-shm` next to the database,
and all three must stay together on one volume. With the volume at `/data`, keep the default
`DATABASE_PATH=/data/grimoire.db`. A missing directory is created on start.

The server runs as uid 1000, which owns `/data` in the image. A named volume inherits that; a
bind-mounted host directory must be writable for uid 1000.

## Encryption key

`TOKEN_ENCRYPTION_KEY` encrypts the Git access token of every source; the database alone does not
reveal them. Generate it once:

```bash
openssl rand -base64 32
```

- Every start needs the same key. Without a key the server does not start. With another key it
  starts, but every source with a token fails to sync until an admin enters its token again.
- Never store the key next to the database backups: together they reveal every token.

## One instance

Run exactly one grimoire process per database file. On Kubernetes: `replicas: 1`,
`strategy: Recreate`, and a `ReadWriteOnce` or `ReadWriteOncePod` volume.

!!! danger "Data loss"
    Never put the file on a `ReadWriteMany` volume or another network file system.
    Locking is unreliable there, and two writers can corrupt the file.

## Updating from a 0.x release

Releases before `1.0.0` are previews with no update path between them: a database written by one
`0.x` release may not work with a later one. Start the new release with an empty volume and enter
sources and API keys again.

## Backups

Take a consistent copy while grimoire runs:

```bash
sqlite3 /data/grimoire.db ".backup /backup/grimoire.db"
```

A plain file copy of a running database can miss changes still in `<file>-wal`; copy files only
while grimoire is stopped.

# Running with Docker

grimoire runs as one container: the server, `git` for syncing, and a volume for the SQLite file.
Build the image from the repository:

```bash
make image   # docker build --tag grimoire:latest .
```

## Starting

```bash
docker run --detach --name grimoire \
  --publish 3000:3000 \
  --volume grimoire-data:/data \
  --env TOKEN_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  grimoire:latest
```

Generate the key once and keep it: the same key has to be passed on every start, or the access
tokens of all sources can no longer be read (see [Database](database.md#access-tokens)). The
container refuses to start without it.

Then open `/admin`, set up the admin account with the setup token from `docker logs grimoire`,
add a project with a source and create an API key (see [Admin area](admin.md)).

## Environment

| Variable | In the image | Meaning |
|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | not set, required | Key encrypting the Git access tokens. |
| `DATABASE_PATH` | `/data/grimoire.db` | Path of the SQLite file, on the volume. |
| `SYNC_SCHEDULE` | `*/5 * * * *` | When sources without their own schedule are checked; in the container's time zone (`TZ`, UTC by default). |
| `MIGRATE_ONLY` | `false` | With `true`, update the schema and exit, e.g. in an init container. |
| `PORT` | `3000` | Port the server listens on. |
| `PROTOCOL_HEADER`, `ADDRESS_HEADER` | not set | Behind a reverse proxy, the headers carrying the original protocol and client address (see [Admin area](admin.md#logging-in)). |

The variables are described in detail in [Database](database.md#configuration).

## Volume

Mount a volume or a directory at `/data`. The server runs as the user `node` (uid 1000), which
owns `/data` in the image; a named volume inherits that, a bind-mounted host directory has to be
writable for uid 1000. Everything grimoire keeps lives there; the container itself can be
replaced at any time, for example for a new version.

## Inside the container

The working directory is `/grimoire`. Besides the server, the image contains
`scripts/reset-admin.ts` for a lost admin password (see [Admin area](admin.md#lost-password)):

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

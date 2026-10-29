# Running with Docker

grimoire runs as one container: the server, `git` for syncing, and a volume for the SQLite file.
It expects a reverse proxy in front of it that terminates TLS or at least passes on the original
protocol; served directly over plain `http`, every admin form is rejected (see
[Admin area](admin.md#logging-in)).

## Image

Every release is published on Docker Hub as `elnebuloso/grimoire`, tagged with the version of
the release without its `v`: release `v1.2.0` is the image `elnebuloso/grimoire:1.2.0`. There is
no `latest` tag: replace `<version>` below with the release you want, and change it to update.
Releases up to `0.3.0` have no image.

To build the image from the repository instead, for example to try unreleased changes:

```bash
make image   # docker build --tag grimoire:latest .
```

## Docker Compose

The quickest complete setup: grimoire and Caddy as reverse proxy, which sets the
`X-Forwarded-Proto` and `X-Forwarded-For` headers grimoire reads. Save it as `compose.yaml`:

```yaml
services:
  grimoire:
    image: elnebuloso/grimoire:<version>
    restart: unless-stopped
    volumes:
      - grimoire-data:/data
    environment:
      TOKEN_ENCRYPTION_KEY: ${TOKEN_ENCRYPTION_KEY:?generate one with openssl rand -base64 32}
      SYNC_SCHEDULE: "*/5 * * * *"
      TZ: Europe/Berlin
      PROTOCOL_HEADER: x-forwarded-proto
      ADDRESS_HEADER: x-forwarded-for

  proxy:
    image: caddy:2.11.7
    restart: unless-stopped
    command: caddy reverse-proxy --from :8080 --to grimoire:3000
    ports:
      - "8080:8080"

volumes:
  grimoire-data:
```

Put the key into a `.env` file next to it, which Compose reads on its own, and start:

```bash
echo "TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)" > .env
docker compose up --detach
docker compose logs grimoire   # shows the setup token
```

Open `http://localhost:8080/admin`, set up the admin account with the setup token, add a project
with a source and create an API key (see [Admin area](admin.md)).

Keep the `.env` file: the same key has to be passed on every start, or the access tokens of all
sources can no longer be read (see [Database](database.md#access-tokens)). The container refuses
to start without it.

On a server with a public domain, replace `:8080` with the domain, for example
`--from grimoire.example.com`, and publish the ports `80` and `443` instead of `8080`: Caddy then
obtains a TLS certificate on its own. Mount a volume at `/data` of the proxy as well, so it keeps
the certificate across restarts.

## Without Compose

The same container with `docker run`, for a host where a reverse proxy already runs and forwards
to port `3000`. Generate the key once and keep it with your other secrets:

```bash
openssl rand -base64 32

docker run --detach --name grimoire \
  --publish 3000:3000 \
  --volume grimoire-data:/data \
  --env TOKEN_ENCRYPTION_KEY="<key>" \
  --env PROTOCOL_HEADER=x-forwarded-proto \
  --env ADDRESS_HEADER=x-forwarded-for \
  elnebuloso/grimoire:<version>
```

The setup token is in `docker logs grimoire`. Set the two header variables only when the proxy
really sends those headers: once `ADDRESS_HEADER` is set, a request without it fails.

## Kubernetes

Nothing in the image is specific to Docker; a Deployment needs the same pieces:

- the image, with the variables below as `env`, and `TOKEN_ENCRYPTION_KEY` from a Secret;
- a PersistentVolumeClaim mounted at `/data`, writable for uid 1000 (`fsGroup: 1000`);
- exactly one replica with `strategy: Recreate` (see [Database](database.md#one-instance));
- a Service on port `3000` and an Ingress whose controller sends the headers named in
  `PROTOCOL_HEADER` and `ADDRESS_HEADER`.

The setup token is in the log of the pod (`kubectl logs`). To update the schema before the new
version serves requests, run the same image with `MIGRATE_ONLY=true` as an init container.

## Environment

| Variable | In the image | Meaning |
|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | not set, required | Key encrypting the Git access tokens. |
| `DATABASE_PATH` | `/data/grimoire.db` | Path of the SQLite file, on the volume. |
| `SYNC_SCHEDULE` | `*/5 * * * *` | When sources without their own schedule are checked. |
| `TZ` | not set (UTC) | Time zone of `SYNC_SCHEDULE` and of the schedules of sources. |
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

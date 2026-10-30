# Running with Docker

grimoire runs as one container: the server, `git` for syncing, and a volume for the SQLite file.
It expects a reverse proxy in front of it that terminates TLS. Plain `http` works only on
`localhost`, with a proxy that passes on the original protocol: served directly, every admin form
is rejected, and under any other host name the browser drops the login cookie (see
[Management area](admin.md#logging-in)).

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

Open `http://localhost:8080/manage`, set up the admin account with the setup token, add a project
with a source and create an API key (see [Management area](admin.md)).

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

### Resources

Memory and CPU are spent mostly while a source syncs: the clone, and turning the pages into
snippets in a second thread. Sources sync one after another, so a large one sets the need, not
the number of sources. Measured with the Kubernetes documentation as one source (1722 pages,
13,160 snippets), from the first sync to its end, while agents searched every 25 ms:

| Limits | Sync | Searches, 99 % / slowest | Memory, peak |
|---|---|---|---|
| none | 77 s | 11 ms / 326 ms | 933 MiB |
| 1 CPU, 512 MiB | 160 s | 46 ms / 411 ms | 392 MiB |
| 0.5 CPU, 256 MiB | 383 s | 77 ms / 1.3 s | 256 MiB, at the limit |

Node sizes its memory to the limit of the container, so a lower limit means more garbage
collection, not a crash, down to where the data of one sync no longer fits. For documentation of
that size, `limits: { cpu: "1", memory: 512Mi }` with `requests: { cpu: 250m, memory: 512Mi }` is
enough; smaller documentation needs less. Below one CPU, searches during a sync wait on the CPU
quota, and syncs take correspondingly longer.

## Environment

| Variable | In the image | Meaning |
|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | not set, required | Key encrypting the Git access tokens. |
| `DATABASE_PATH` | `/data/grimoire.db` | Path of the SQLite file, on the volume. |
| `SYNC_SCHEDULE` | `*/5 * * * *` | When sources without their own schedule are checked. |
| `TZ` | not set (UTC) | Time zone of the schedules and of the times the UI shows. |
| `INCLUDE_URL_ALLOW` | not set (none) | Origins pages may include files from by URL. |
| `LOG_FORMAT` | not set (`ecs`) | `ecs` for one JSON object per line, `pretty` for readable text. |
| `LOG_LEVEL` | not set (`info`) | Lowest level that is written: `error`, `warn`, `info` or `debug`. |
| `SMTP_HOST` | not set (no mail) | SMTP server grimoire sends mail through. Not set: no mail is sent, and what needs it is not offered. |
| `SMTP_PORT` | not set (`587`) | Port of the SMTP server; `465` uses TLS from the start, other ports STARTTLS when the server offers it. |
| `SMTP_USER`, `SMTP_PASSWORD` | not set | Login at the SMTP server; without `SMTP_USER` grimoire sends without logging in. |
| `BASE_URL` | not set | Where grimoire is reached, such as `https://grimoire.example.com`. Links in mails, the `claude mcp add` command on the start page and the links in `llms.txt` point there; not set, the last two use the address the request arrived at. A request arriving at another address is logged once as a warning. Required with `SMTP_HOST`. |
| `SMTP_FROM` | not set | Sender address of the mails, such as `grimoire <grimoire@example.com>`; required with `SMTP_HOST`, the server does not start without it. |
| `MIGRATE_ONLY` | `false` | With `true`, update the schema and exit, e.g. in an init container. |
| `PORT` | `3000` | Port the server listens on. |
| `PROTOCOL_HEADER`, `ADDRESS_HEADER` | not set | Behind a reverse proxy, the headers carrying the original protocol and client address (see [Management area](admin.md#logging-in)). |
| `HOST_HEADER` | not set (`Host`) | Header carrying the host the browser asked for, for a proxy that does not pass on `Host` unchanged (see [Management area](admin.md#logging-in)). There is no `ORIGIN` variable. |

The variables are described in detail in [Database](database.md#configuration).

## Logs

grimoire writes its log to standard output. With `LOG_FORMAT=ecs`, the default, every entry is one
JSON object in the Elastic Common Schema, so a log collector needs no parsing rules for it:
`@timestamp`, `log.level`, `message`, `ecs.version`, `service.name` (`grimoire`), and
for an error `error.type`, `error.message` and `error.stack_trace` in the same line, so a stack
trace never splits into several entries. Git access tokens and credentials in Git URLs are removed
from messages before they are logged.

`LOG_LEVEL` sets how much is written; at `error` only failures remain, except the line with the
setup token (see [Management area](admin.md#first-start)), which is always written.

## Volume

Mount a volume or a directory at `/data`. The server runs as the user `node` (uid 1000), which
owns `/data` in the image; a named volume inherits that, a bind-mounted host directory has to be
writable for uid 1000. Everything grimoire keeps lives there; the container itself can be
replaced at any time, for example for a new version.

## Inside the container

The working directory is `/grimoire`. Besides the server, the image contains
`scripts/reset-admin.ts` for a lost admin password (see [Management area](admin.md#lost-password)):

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

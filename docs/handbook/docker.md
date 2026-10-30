# Running grimoire

!!! info "Prerequisites"
    - Reader: operator.
    - Required access: the Docker host, or the Kubernetes namespace grimoire runs in.
    - Version: images exist from release `0.4.0`; releases before `1.0.0` are previews (see
      [Updating from a 0.x release](database.md#updating-from-a-0x-release)).

    New to grimoire? Read [Concepts](index.md) first.

grimoire runs as one container with a volume at `/data` and needs a reverse proxy in front of it
that terminates TLS.

## Image

The image is `elnebuloso/grimoire:<version>`, the release version without its `v`: release
`v1.2.0` is `elnebuloso/grimoire:1.2.0`. There is no `latest` tag; change the version to update.

To build the image from a checkout of the repository, for example to try unreleased changes:

```bash
make image   # builds grimoire:latest
```

## Docker Compose

grimoire with Caddy as reverse proxy. Save as `compose.yaml`:

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

Generate the encryption key into `.env` next to it, start, and read the setup token:

```bash
echo "TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)" > .env
docker compose up --detach
docker compose logs grimoire
```

Then open `http://localhost:8080/manage` (see [Management area](admin.md#first-start)).

Keep `.env`: every start needs the same key (see [Encryption key](database.md#encryption-key)).

For a public domain, replace `:8080` with the domain, such as `--from grimoire.example.com`,
publish ports `80` and `443` instead of `8080`, and mount a volume at `/data` of the proxy:
Caddy then obtains and keeps a TLS certificate.

## Docker without Compose

For a host where a reverse proxy on the same host forwards to port `3000`:

```bash
docker run --detach --name grimoire \
  --publish 127.0.0.1:3000:3000 \
  --volume grimoire-data:/data \
  --env TOKEN_ENCRYPTION_KEY="<KEY_FROM_OPENSSL_RAND_BASE64_32>" \
  --env PROTOCOL_HEADER=x-forwarded-proto \
  --env ADDRESS_HEADER=x-forwarded-for \
  elnebuloso/grimoire:<version>
```

The setup token is in `docker logs grimoire`.

## Kubernetes

A Deployment needs:

- the image, with the variables below as `env` and `TOKEN_ENCRYPTION_KEY` from a Secret;
- a PersistentVolumeClaim at `/data`, writable for uid 1000 (`fsGroup: 1000`);
- exactly one replica with `strategy: Recreate` (see [One instance](database.md#one-instance));
- a Service on port `3000`, and an Ingress whose controller sends the headers named in
  `PROTOCOL_HEADER` and `ADDRESS_HEADER`.

The setup token is in `kubectl logs`. To update the schema before the new version serves, run the
same image with `MIGRATE_ONLY=true` as an init container.

### Memory and CPU limits

Syncs set the need: sources sync one at a time, so the largest source counts, not the number of
sources. Measured with the Kubernetes documentation as one source (1722 pages, 13,160 snippets),
while agents searched every 25 ms:

| Limits | Sync | Searches, 99 % / slowest | Memory, peak |
|---|---|---|---|
| none | 76 s | 44 ms / 365 ms | 923 MiB |
| 1 CPU, 512 MiB | 149 s | 70 ms / 800 ms | 437 MiB |
| 0.5 CPU, 256 MiB | 426 s | 178 ms / 953 ms | 256 MiB, at the limit |

For documentation of that size, use `limits: { cpu: "1", memory: 512Mi }` with
`requests: { cpu: 250m, memory: 512Mi }`. A lower memory limit makes syncs slower until one no
longer fits; then that sync fails with
`indexing ended with … before it finished, out of memory for example`, the source keeps its
previous index, and grimoire keeps answering. On less CPU, a large source can outlast the
indexing deadline; raise `INDEXING_DEADLINE_MINUTES`. Below one CPU, searches during a sync wait
for CPU time.

## Setup token

While no admin account exists, grimoire logs a setup token on every start, whatever `LOG_LEVEL`
says:

```text
No admin account yet. Set it up at /setup with the setup token 7GQm…
```

With `LOG_FORMAT=ecs` it is the `message` of a JSON line. Pass the token to whoever sets up the
admin account. A restart before the setup logs a new token and voids the old one. Only someone who
can read the log can set up the account, even when `/setup` is reachable from outside.

## Reverse proxy

Pass on the original protocol, client address and `Host` header, and set `PROTOCOL_HEADER` and
`ADDRESS_HEADER` to the headers the proxy sends. Set them only when the proxy really sends them:
once `ADDRESS_HEADER` is set, a request without that header fails. Without `ADDRESS_HEADER`, all
failed logins count for the proxy's address, and one client's typos lock everybody out.

With `ADDRESS_HEADER` set, only the proxy may reach grimoire's port. Anyone who reaches it directly
sets the header themselves, counts as a new client on every request and gets past the limits on
failed logins and password reset requests.

Outside `localhost`, serve grimoire over `https`. Plain `http` works only on `localhost`, behind a
proxy that sends the protocol header.

grimoire keeps itself out of search engines: `/robots.txt` disallows all crawling, and pages and
agent routes answer with `X-Robots-Tag: noindex, nofollow`. Let both through the proxy unchanged;
a proxy that serves its own `robots.txt` or drops the header lets a crawler that reaches grimoire
index the documentation it serves.

### Every form fails with `Cross-site POST form submissions are forbidden`

grimoire compares the origin of every form with its own, built from the protocol and the host of
the request. Check, in order:

1. Served directly over `http`, without a proxy: put a proxy in front, as in
   [Docker Compose](#docker-compose).
2. `PROTOCOL_HEADER` not set: grimoire assumes `https`. Set it to the header carrying the
   original protocol, such as `x-forwarded-proto`.
3. The proxy replaces `Host` with the name of the upstream (nginx does unless configured with
   `proxy_set_header Host $host;`): keep `Host`, or set `HOST_HEADER` to the header carrying the
   original host, such as `x-forwarded-host`.

There is no `ORIGIN` variable; setting one changes nothing. `BASE_URL` does not take part either.

### The login is accepted, and the next page asks for it again

The browser dropped the login cookie: it is sent only over `https` on every host but `localhost`.
Serve grimoire over `https`, for example `https://grimoire.lan` instead of
`http://grimoire.lan:8080`.

## Mail

Mail is needed only for **Forgot your password?** on the login page; without it that link is not
offered and `/login/forgot` answers `404`. Set `SMTP_HOST`, `SMTP_FROM` and `BASE_URL`; the server
does not start with `SMTP_HOST` but without the other two.

On ports other than `465`, the SMTP server must offer STARTTLS, or no mail is sent: otherwise anyone
between grimoire and the mail server could read `SMTP_PASSWORD` and every reset link. For a mail
server on the same host that offers no TLS, such as a local mail catcher, set
`SMTP_ALLOW_PLAINTEXT=true`. A failed mail is logged with its subject and the error, never with the
recipient address.

## Environment variables

| Variable | Default in the image | Meaning |
|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | none, required | Key encrypting the Git access tokens of all sources: 32 random bytes, base64. The server does not start without it, also with `MIGRATE_ONLY`. See [Encryption key](database.md#encryption-key). |
| `DATABASE_PATH` | `/data/grimoire.db` | Path of the database file; created with its schema on first start. Keep it in a directory of its own (see [Volume](database.md#volume)). |
| `SYNC_SCHEDULE` | `*/5 * * * *` | When sources without their own schedule are checked: cron with five fields (minute, hour, day of month, month, day of week), in `TZ`. For a Git server that allows few requests, `0 * * * *`. |
| `INDEXING_DEADLINE_MINUTES` | `10` | How long indexing one source may take before its sync fails, whole minutes from 1 to 1440. Raise it when a large source fails with `indexing took longer than 10 minutes` (see [Memory and CPU limits](#memory-and-cpu-limits)); one source indexes at a time, so every other source waits that long behind it. |
| `TZ` | UTC | IANA time zone, such as `Europe/Berlin`. Schedules run in it, including summer time, and the UI shows every time in it, whatever the browser's time zone. API key expiry dates end at midnight in it. |
| `INCLUDE_URL_ALLOW` | none | Origins pages may include files from by URL, separated by commas, such as `https://docs.example.com,https://raw.githubusercontent.com`. `https://` only, nothing after host and port. Nothing else is requested for an include, and no redirect is followed. |
| `LOG_FORMAT` | `ecs` | `ecs`: one JSON object per line (see [Logs](#logs)). `pretty`: readable text for local use. |
| `LOG_LEVEL` | `info` | Lowest level written: `error`, `warn`, `info` or `debug`. |
| `PROTOCOL_HEADER` | none | Header carrying the original protocol, such as `x-forwarded-proto`. Without it, grimoire assumes `https`. |
| `ADDRESS_HEADER` | none | Header carrying the client address, such as `x-forwarded-for`. Requests without it fail. |
| `HOST_HEADER` | `Host` | Header carrying the host the browser asked for, for a proxy that rewrites `Host`. |
| `BASE_URL` | none | Where grimoire is reached, such as `https://grimoire.example.com`. Reset links, the `claude mcp add` command on the start page and the links in `llms.txt` use it; without it the last two use the address of the request. A request to another address is logged once as a warning. |
| `SMTP_HOST` | none | SMTP server for mail. Without it no mail is sent. |
| `SMTP_PORT` | `587` | `465` uses TLS from the start, other ports STARTTLS. |
| `SMTP_ALLOW_PLAINTEXT` | none | `true`: send without TLS when the server offers no STARTTLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | none | Login at the SMTP server; without `SMTP_USER` grimoire sends without one. |
| `SMTP_FROM` | none | Sender, such as `grimoire <grimoire@example.com>`. |
| `MIGRATE_ONLY` | `false` | `true`: update the schema and exit, such as in an init container. |
| `PORT` | `3000` | Port the server listens on. |

An invalid value of `SYNC_SCHEDULE`, `INDEXING_DEADLINE_MINUTES`, `TZ`, `INCLUDE_URL_ALLOW`, `LOG_FORMAT` or `LOG_LEVEL` stops
the start with an error naming the variable.

## Logs

grimoire logs to standard output. With `LOG_FORMAT=ecs` every entry is one JSON line in the
Elastic Common Schema, so a log collector needs no parsing rules: `@timestamp`, `log.level`,
`message`, `ecs.version`, `service.name` (`grimoire`), and for errors `error.type`,
`error.message` and `error.stack_trace` in the same line. Git access tokens and credentials in Git
URLs are removed before logging.

At `LOG_LEVEL=error` only failures remain, and the setup token line.

## Lost admin password

When mail is not set up, or the last admin cannot receive it, delete the admin account and set it
up again:

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

The script asks for the email address of an admin and deletes that user and their sessions only
when the address matches; without a terminal (`-it`) it refuses. grimoire keeps running. When no
other admin is left, it logs `Admin account was reset.` and a new setup token.

Anyone who can run `docker exec` or `kubectl exec` in the container can do this; restrict who may.

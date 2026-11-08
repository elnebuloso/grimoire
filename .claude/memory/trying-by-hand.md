# Trying things by hand

## Agent environment

- Its log is `app/.agent/server.log`. `make agent-reset` rebuilds the database from the migrations
  and fills in the fixture data below, whether the server runs or not.
- Sources sync from `https://github.com/elnebuloso/grimoire-fixture-docs` and need network. Its
  `README.md` lists the pages, snippet IDs and dead links each source path produces.

## Fixture data

| What | Value |
|---|---|
| Admin login | `agent@example.com` / `agent-password` |
| User login (no role) | `user@example.com` / `user-password` |
| API key of the admin (all sources) | `grimoire_agent-fixture-key` |
| API key of the user (all sources) | `grimoire_user-fixture-key` |
| Settings | defaults: syncs not paused |

| Source | Path in the fixture repository | Visibility | State after a reset |
|---|---|---|---|
| `platform-docs` | `zensical/docs` | internal | synced within about 15 s of a reset, pages, snippets and 3 dead links |
| `billing-docs` | `mkdocs/docs` | public | synced within about 15 s of a reset, pages, snippets and 3 dead links |
| `billing-archive` | `archive/docs` (does not exist) | internal | sync fails with an error |
| `platform-next` | `zensical/docs` | internal | paused and never synced; only "sync now" syncs it; duplicates `platform-docs` on purpose, written past the duplicate check, so `/manage/duplicates` has a pair to show |

## Mail

`make agent-start` also starts a mail catcher (`axllent/mailpit`), SMTP on port 5125, and
`make agent-stop` stops it. Invitations and password reset links land in its inbox at
`http://localhost:5825`, also readable as JSON at `http://localhost:5825/api/v1/messages`.

## Identity providers

`make agent-start` also starts an OIDC mock (`ghcr.io/navikt/mock-oauth2-server`) at
`http://localhost:5580`; `make agent-stop` stops it. Every path is its own issuer:

| Provider key | Issuer | Login button | Rule |
|---|---|---|---|
| `gitlab` | `http://localhost:5580/gitlab` | GitLab | sign-up for verified addresses at `example.com` |
| `entra` | `http://localhost:5580/entra` | Microsoft | every login needs the claim `hd=example.com`; no sign-up |

The mock's login form takes a `username`, which becomes the subject (`sub`), and the claims as JSON,
e.g. `{"email": "new@example.com", "email_verified": true}`. The same username at the same
provider is the same identity. The mock overwrites `tid` with the path, so test required claims
with another claim. The per-provider variables are exported by `scripts/agent-env.sh`, not
written to `.env`: SvelteKit reads only declared variables from there.

The dev server runs over plain `http`, so curl needs no `X-Forwarded-Proto` header here; the
curl notes below apply otherwise.

## Gotchas

- Admin forms with curl: a POST without a body gets 415, send `-d ""`. Over plain `http` add
  `-H X-Forwarded-Proto:http -H Origin:<url>` (server with `PROTOCOL_HEADER=x-forwarded-proto`);
  `-H 'x-sveltekit-action: true'` returns the action result as JSON.
- MCP with curl needs `Accept: application/json, text/event-stream`, or the transport rejects the
  request.
- Stop a test server by the PID `ss -ltnp` shows for its port, not by `$!`, which is the PID of
  the wrapping shell or npm. `pkill -f <pattern>` kills the agent's own shell, whose command line
  contains the pattern.
- `docker exec -it` needs a terminal; without one:
  `printf 'new password\nnew password\n' | script -qec "docker exec -it <container> node scripts/grant-admin.ts <email> --password" /dev/null`.
  The output then shows the piped passwords: the pseudo terminal echoes them before the script
  turns echo off. Typed by hand, they stay hidden.
- The OIDC callback page continues by `<meta http-equiv="refresh">`, not by a redirect: curl
  stops there. A login is complete at that point; a link is not until the page's
  `/account/link` is requested with the same cookies.
- The Playwright MCP browser saves screenshots only inside the repository (`.playwright-mcp/`,
  ignored by git), not in the scratchpad.
- A dev server started before an update can run old server code against a newer indexing
  worker, which is read from disk at every sync: after a pull that touches `sync/`, restart
  `make dev` or the agent environment (`make agent-stop && make agent-start`).
- Close the Playwright MCP browser (`browser_close`) once a check by hand is done: it stays open
  in WSL otherwise, and a hung page blocks every later call until it is closed.
- Never click a destructive action with the Playwright MCP browser outside the agent environment.
- Sources added to the agent database by hand with made-up Git URLs are synced by its scheduler
  within seconds and end with a sync error; reset afterwards. `make agent-many-sources` adds 500
  paused ones, which the scheduler leaves alone; `make agent-reset` removes them.
- A Playwright click on a button that opens a dialog does nothing before hydration: load the page
  with `waitUntil: 'networkidle'` first.

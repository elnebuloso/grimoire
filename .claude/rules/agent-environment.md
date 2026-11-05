# Agent environment

Try changes by hand in the agent environment, never in `make dev`: that one is the developer's,
with their `app/.env` and their database. The agent environment is a dev server with its own
settings, database and generated files in `app/.agent/` (not committed); code changes show up
without a restart. It runs beside `make dev` (5173) and `make e2e` (4173, 4174).

- `make agent-start` starts it in the background at `http://localhost:5174`, log in
  `app/.agent/server.log`. `make agent-stop` stops it.
- `make agent-reset` rebuilds its database from the migrations and fills in the fixture data below,
  running or not. Reset after anything that changed the data or the schema, before the next check
  starts from an assumed state.
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
other curl notes in `memory.md` apply.

# Agent environment

Try changes by hand in the agent environment, never in `make dev`: that one is the developer's,
with their `app/.env` and their database. The agent environment is a dev server with its own
settings, database and generated files in `app/.agent/` (not committed); code changes show up
without a restart. It runs beside `make dev` (5173) and `make e2e` (4173).

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
| API key (all projects) | `grimoire_agent-fixture-key` |
| Settings | defaults: syncs not paused |

| Source | Path in the fixture repository | State after a reset |
|---|---|---|
| `platform-docs` | `zensical/docs` | synced within about 15 s of a reset, pages, snippets and 3 dead links |
| `billing-docs` | `mkdocs/docs` | synced within about 15 s of a reset, pages, snippets and 3 dead links |
| `billing-archive` | `archive/docs` (does not exist) | sync fails with an error |
| `platform-next` | `zensical/docs` | paused and never synced; only "sync now" syncs it |

The dev server runs over plain `http`, so curl needs no `X-Forwarded-Proto` header here; the
other curl notes in `memory.md` apply.

# Handoff

## Where we stand

1.6.0 is the latest release. Since 1.1.1 grimoire gained:

- checked outgoing Git calls: `https`, port 443, public addresses only, no redirects, internal Git
  servers through `GIT_ALLOWED_HOSTS` (1.2.0);
- one source per repository path, with a list for admins under `/manage/duplicates` (1.3.0,
  ADR 0008);
- export of an instance and import into an empty one (1.4.0, ADR 0009);
- a redirect from the Git server is explained, a target on the same host is suggested, never
  followed (1.5.0);
- sessions end after 60 minutes idle or 12 hours at most (1.6.0).

Impeccable is no longer used: its files and `docs/DESIGN.md`, `docs/PRODUCT.md` are gone. The tokens
in `app/src/app.css` are the binding source of the visual design (`.claude/rules/ui-components.md`).

The backlog has no open task.

## Next

Nothing is planned. Ask the owner what comes next.

## Working with the owner

- Decisions one question at a time, in chat, never in a popup dialog.
- Before a feature is built, its rules go to the owner as a short table; only confirmed rules go
  into the task, an ADR or the handbook.
- A new ADR stays `Proposed` until the owner accepts it.
- The commit type decides the release: `feat` and `fix` only for what ships. Push only on the
  owner's word. After each release, add a summary at the top of the GitHub release
  (`.claude/rules/memory.md`); every release from v0.0.0 on has one.

## Watch out

- **Every push to `main` releases.**
- **Pull with `git pull --rebase origin main`.** VS Code fetches in the background; a fetch at the
  same moment writes `main` twice into `.git/FETCH_HEAD`, and a plain `git pull --rebase` stops
  with "Cannot rebase onto multiple branches".
- **`app/src/lib/server/fixtures/export-schema-4.grimoire-export` is never written again.** It
  stands for exports made by 1.4.0; specs and the image smoke import it through every later
  migration. `instance-import.spec.ts` pins its schema as `FIXTURE_SCHEMA`.
- **A new column of an exported table fails `instance-export.spec.ts`** until it is listed in
  `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS`. A new kind of stored secret would travel encrypted:
  export and import handle only `sources.encrypted_token`.
- **Specs that mock `$app/env/private`** for a module reaching the Git check need
  `GIT_ALLOWED_HOSTS: []` in the mock. Local test repositories pass only through a policy with
  `allowLocal: true`, which no environment variable sets.
- **`make e2e` needs `openssl` and the ports 4443 (local https Git server), 4173, 4174 (second,
  empty instance for the import), 4125/4825 (mail catcher) and 4580 (OIDC mock).**
- **Type errors from stale messages:** the Paraglide output under `app/src/lib/paraglide` is
  generated; `svelte-check` alone may see an old one. `make lint` compiles it first.
- **After a schema change** the agent environment needs `make agent-reset`.
- **The Playwright MCP browser saves screenshots only inside the repository**
  (`.playwright-mcp/`, ignored by git), not in the scratchpad.

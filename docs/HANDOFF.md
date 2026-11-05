# Handoff

## Where we stand

1.8.0 is the latest release; both releases of this session carry their summary on GitHub.

- **1.7.0** (ADR 0010): a source is `internal` (any user's key, every logged-in user) or `public`
  (anyone, no key); `private` and source owners are gone. Only admins add, change and delete
  sources; the whole `/manage` area needs the admin role. Users without it land on `/` and reach
  their keys through **My API keys** in the header.
- **1.8.0** (ADR 0011): single sign-on through OpenID Connect providers, rebuilt from the reverted
  SSO milestone. Providers come from `OIDC_PROVIDERS` and `OIDC_<KEY>_*`; identities are linked
  by issuer and subject, never by email; accounts from a provider have no role and may have no
  password. Code in `app/src/lib/server/oidc/`, routes under `/auth/oidc/[key]` and
  `/account/link`, `/account/unlink`; operator page `docs/handbook/sso.md`.

The backlog has no open task.

## Next

Ask the owner which of the remaining points of
`/workspace/github.com/elnebuloso/grimoire-before-reset/TODO-UEBERNAHME.md` comes next. Open there:

- `5046aba` refactor(auth): foreign keys remove the rows of a reset admin.
- `688648f` `make dev` loads `app/.env` – useful now, see the `OIDC_<KEY>_*` trap below.
- `1377c04` `scripts/grant-admin.ts` instead of `reset-admin.ts`; it hung on the old owner model,
  so only with a cut agreed with the owner.
- Insights from the old `.claude/rules/` (`git diff v1.1.1 HEAD -- .claude` in that directory)
  and the tool hints of its last handoff.
- Still unchecked from the old SSO: whether GitLab or Entra send `WWW-Authenticate` on errors at
  the token endpoint; `classifyLoginFailure` is tested only against a simulated `fetch`. Needs a
  real provider.

The old directory is a reference only: never push from it, its remote is removed. Tick points off
in its `TODO-UEBERNAHME.md` once released.

## Working with the owner

- Decisions one question at a time, in chat, never in a popup dialog.
- Before a feature is built, its rules go to the owner as a short table; only confirmed rules go
  into the task, an ADR or the handbook.
- A new ADR stays `Proposed` until the owner accepts it.
- The commit type decides the release: `feat` and `fix` only for what ships. **No breaking change
  marker (`!`, `BREAKING CHANGE`) unless the owner asks for one in so many words** – "feat!" from
  the owner meant "feat, go", not a major release. Push only on the owner's word. After each
  release, add a summary at the top of the GitHub release (`.claude/rules/memory.md`).

## Watch out

- **Every push to `main` releases.**
- **Pull with `git pull --rebase origin main`.** VS Code fetches in the background; a fetch at the
  same moment writes `main` twice into `.git/FETCH_HEAD`, and a plain `git pull --rebase` stops
  with "Cannot rebase onto multiple branches".
- **`app/src/lib/server/fixtures/export-schema-4.grimoire-export` is never written again.** It
  stands for exports made by 1.4.0; specs and the image smoke import it through every later
  migration. Its private source arrives as internal, its users without identities.
- **A new column of an exported table fails `instance-export.spec.ts`** until it is listed in
  `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS`; a new table until it is in `EXPORTED_COLUMNS` or
  `EMPTIED_TABLES`. A new kind of stored secret would travel encrypted: export and import handle
  only `sources.encrypted_token`.
- **Specs that mock `$app/env/private`** need what the modules behind the route read: `GIT_ALLOWED_HOSTS: []`
  for the Git check, `OIDC_PROVIDERS: ''` and `BASE_URL: ''` for login, invite and account
  routes. A missing one fails with `No "<NAME>" export is defined on the "$app/env/private" mock`.
- **`OIDC_<KEY>_*` are read from `process.env`, not from `app/.env`**: SvelteKit reads only
  declared variables from there. `make dev` needs them exported in the shell; the agent
  environment exports them in `scripts/agent-env.sh`.
- **In e2e, `getByRole('button', { name: 'Log in' })` also matches the provider buttons**
  (`Log in with GitLab`); use `exact: true`.
- **`make e2e` needs Docker, `openssl` and the ports 4443 (local https Git server), 4173, 4174
  (second, empty instance for the import), 4125/4825 (mail catcher) and 4580 (OIDC mock).**
- **The agent fixture `platform-next` duplicates `platform-docs`** (same repository and path). The
  seed writes it directly, past the duplicate check, on purpose: `/manage/duplicates` has a pair
  to show.
- **Type errors from stale messages:** the Paraglide output under `app/src/lib/paraglide` is
  generated; `svelte-check` alone may see an old one. `make lint` compiles it first.
- **After a schema change** the agent environment needs `make agent-reset`.
- **The Playwright MCP browser saves screenshots only inside the repository**
  (`.playwright-mcp/`, ignored by git), not in the scratchpad.

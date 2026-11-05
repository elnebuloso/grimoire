# Handoff

## Where we stand

1.9.0 is the latest release; every release carries its summary on GitHub.

- **1.7.0** (ADR 0010): a source is `internal` (any user's key, every logged-in user) or `public`
  (anyone, no key); `private` and source owners are gone. Only admins add, change and delete
  sources; the whole `/manage` area needs the admin role. Users without it land on `/` and reach
  their keys through **My API keys** in the header.
- **1.8.0** (ADR 0011): single sign-on through OpenID Connect providers, rebuilt from the reverted
  SSO milestone. Providers come from `OIDC_PROVIDERS` and `OIDC_<KEY>_*`; identities are linked
  by issuer and subject, never by email; accounts from a provider have no role and may have no
  password. Code in `app/src/lib/server/oidc/`, routes under `/auth/oidc/[key]` and
  `/account/link`, `/account/unlink`; operator page `docs/handbook/sso.md`.
- **1.9.0** (TASK-247): `scripts/grant-admin.ts <EMAIL_ADDRESS> [--password]` replaces
  `reset-admin.ts`. It gives an existing account the role admin and deletes nothing; an unknown
  address is refused, no account is created (the owner's decision). `make admin-grant
  EMAIL=… [PASSWORD=1]` runs it locally; handbook `docs/handbook/docker.md` "Lost admin access".

The backlog has no open task.

## Next

Nothing is planned; ask the owner. The takeover from the old directory is finished and the
directory is deleted. One point of it stays open until a real provider account is at hand:

- Whether GitLab or Entra send `WWW-Authenticate` on errors at the token endpoint;
  `classifyLoginFailure` is tested only against a simulated `fetch`.

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

- **`make admin-grant EMAIL=… PASSWORD=1` was never run through `make`**; only the script itself,
  with `--password` once in a pseudo terminal (`script -qec`). Try it before relying on it.
- **Every push to `main` releases.**
- Durable facts about the code and the tools are in `.claude/rules/`.

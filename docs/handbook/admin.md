# Admin area

The admin area at `/admin` manages projects, sources and API keys. It has one local admin
account, set up in the browser on first start.

## First start

While there is no admin account, every page of the admin area leads to `/admin/setup` instead of
the login. Setting up needs a one-time setup token, which grimoire writes to its log on start:

```text
No admin account yet. Set it up at /admin/setup with the setup token 7GQm…
```

Enter the token, a username and a password of at least 12 characters. Only someone who can read
the server log can set up the account, even if the URL is reachable before you get to it. The
token exists only in memory: a restart before the setup logs a new one, and once the account
exists `/admin/setup` is gone.

## Logging in

A login lasts 12 hours. The password is stored only as a scrypt hash. After 10 failed logins from
one address, that address is blocked for 15 minutes.

The admin forms check that a request comes from grimoire's own origin. grimoire assumes `https`
unless `PROTOCOL_HEADER` names a header that tells it otherwise. Behind a reverse proxy, set it to
the header the proxy sends with the original protocol (for example `x-forwarded-proto`), and
`ADDRESS_HEADER` to the one with the client address (for example `x-forwarded-for`), so failed
logins are counted per client and not for the proxy. Served directly over plain `http`, without
a proxy, every admin form is rejected with `Cross-site POST form submissions are forbidden`: the
browser sends no such header. To try grimoire locally, put a proxy in front, as in the
[Docker Compose](docker.md#docker-compose) example.

## Changing the password

**Change the password** in the admin area asks for the current password and a new one of at least
12 characters. A wrong current password counts as a failed login. After the change, every other
session is logged out; the browser that made the change stays logged in.

## Projects and sources

A project groups sources; agents search a project as a whole. A source is one Git repository,
one branch and one path in it. To serve two paths of the same repository, add it twice as two
sources with different slugs.

| Field | Meaning |
|---|---|
| Slug | Part of every ID agents see (`<project>/<source>/<page>`): lowercase letters, digits and single hyphens. A source slug is unique within its project. |
| Git URL | `https://` only, without `user:token@`; username and token have their own fields. |
| Path | Relative to the repository root, e.g. `docs/`; empty for the whole repository. |
| Exclusions | Glob patterns relative to the repository root, one per line, e.g. `docs/drafts/**`. |
| Schedule | Cron expression with five fields, in the server time zone; empty uses `SYNC_SCHEDULE`. |
| Username, token | A read-only token of the Git host, e.g. a GitLab deploy token or a GitHub fine-grained token. |

The token is stored encrypted with `TOKEN_ENCRYPTION_KEY` and never shown again. Leave the field
empty to keep the stored token, or tick "Remove the stored token" to drop it. When the Git URL
moves to another server, grimoire asks for the token again, so a stored token never goes to a
server it was not entered for.

Saving a source starts a sync right away, so a changed path or exclusion applies without waiting
for a new commit. Deleting a project deletes its sources and their index.

## Status and sync

The page of a source shows when it was last checked and synced, the commit, and how many pages,
snippets and tokens it holds. A sync that failed shows its error; the index of the last
successful sync stays in use until the next one succeeds. Pages that could not be processed are
listed as warnings, and links that lead nowhere as dead links, each with the page and section
it is on.

Every page links to a preview: the page exactly as the agent operation `read` returns it, split
into its snippets with their `Source:` and `Edit:` lines.

**Sync now** syncs the source at once, even when the branch has not moved, and shows the result.

## API keys

Agents authenticate with an API key, sent as `Authorization: Bearer <key>`. Under **API keys**,
create one with a name and the projects it may read: all of them, including projects added
later, or a selection.

The key is shown once, right after it is created. grimoire stores only its SHA-256 hash, so a
lost key cannot be recovered: revoke it and create a new one. Revoking takes effect with the next
request. A key limited to a selection loses a project when the project is deleted, and sees
nothing once all of them are gone.

## Lost password

Without the current password, the password cannot be changed in the admin area. Delete the admin
account with the script in the container:

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

It asks for the username of the admin account and deletes it, together with all sessions, only
when the name matches; without a terminal (no `-it`) it refuses to run. grimoire keeps running,
logs `Admin account was reset.` and a new setup token, and the admin area offers the setup again.

The script cannot be protected by a password of its own: whoever can run commands in the
container can read the database anyway. What protects the admin account is who may use
`docker exec` or `kubectl exec`.

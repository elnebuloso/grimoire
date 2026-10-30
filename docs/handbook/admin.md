# Management area

The management area at `/manage` holds projects, sources, API keys and the settings of the instance.

## Users and roles

Everyone who logs in is a user with an email address and a password of their own; the address is
the login, in any letter case. What a user may do
follows from their roles; a user can hold several. Today there is one role, `admin`, which may use
the whole management area. A logged-in user without it gets `403` there, but can still open their
account page, log out and log in as someone else. The first user, with the role `admin`, is
created in the browser on first start; adding further users comes in a later version.

## First start

While no user has the role `admin`, every page of the management area leads to `/setup` instead of
the login. Setting up needs a one-time setup token, which grimoire writes to its log on start:

```text
No admin account yet. Set it up at /setup with the setup token 7GQm…
```

This line is written whatever `LOG_LEVEL` says. With `LOG_FORMAT=ecs`, the default, it is the
`message` of a JSON line:

```json
{"log.level":"warn","@timestamp":"2026-10-29T21:38:02.587Z","service.name":"grimoire","message":"No admin account yet. Set it up at /setup with the setup token 7GQm…", …}
```

Enter the token, your email address and a password of at least 12 characters. Only someone who can read
the server log can set up the account, even if the URL is reachable before you get to it. The
token exists only in memory: a restart before the setup logs a new one, and once the account
exists `/setup` is gone.

## Logging in

Every page offers **Log in** (`/login`) while nobody is logged in; once logged in, the same place
shows the user's name, linked to their account page, **Manage** for a user who may open the
management area, and **Log out**. A user lands where they may work after logging in: in the
management area, or on the start page without a role for it. Next to it, a button per language
switches the interface between English and German. Without a choice, grimoire uses the language
the browser asks for, and English when it asks for neither; a choice is kept in a cookie and wins
over the browser. Sync errors and warnings stay in English, as Git and the parser report them. A login lasts 12 hours. The
password is stored only as a scrypt hash. After 10 failed logins from
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

The account page `/account`, behind the own name in the header, changes the password of every
user, whatever their roles. It asks for the current password and a new one of at least
12 characters. A wrong current password counts as a failed login. After the change, every other
session of that user is logged out; the browser that made the change stays logged in. Other
users stay logged in.

## Projects and sources

A project groups sources; agents search a project as a whole. A source is one Git repository,
one branch and one path in it. To serve two paths of the same repository, add it twice as two
sources with different names.

**New project** leads through three steps: the project, its first source, and a summary.
Nothing is saved before **Create project** on the summary; leaving the wizard earlier leaves no
project behind. Further sources are added on the project's page.

Name, slug and short description of every project are public: the start page `/` lists them without
login, with counts of sources, pages, snippets, tokens, sync errors and dead links and the oldest
last sync. It shows nothing about the sources themselves, neither Git URLs nor error messages.

| Field | Meaning |
|---|---|
| Name | What people read, at most 80 characters. On creation, grimoire derives the slug from it and shows it next to the field while you type: lowercase letters, digits and single hyphens, umlauts spelled out (`Prüfung & Abnahme` → `pruefung-abnahme`), at most 40 characters. The slug is part of every ID agents see (`<project>/<source>/<page>`); a project slug is unique, a source slug unique within its project. Renaming keeps the slug. |
| Git URL | `https://` only, without `user:token@`; username and token have their own fields. |
| Documentation URL | Optional: where the documentation of the source is published as a site, for example built with MkDocs or Zensical. `https://` or `http://`, without `user:password@`. The page of the source and the source list of the project link to it; the public start page and agents do not see it. |
| Path | Relative to the repository root, e.g. `docs/`; empty for the whole repository. |
| Exclusions | Glob patterns relative to the repository root, one per line, e.g. `docs/drafts/**`. |
| Schedule | Cron expression with five fields, in the time zone `TZ`; empty uses `SYNC_SCHEDULE`. An expression that never runs, such as `0 0 30 2 *` (30 February), is rejected. |
| Paused | Polling skips the source; only **Sync now** syncs it. |
| Username, token | A read-only token of the Git host, e.g. a GitLab deploy token or a GitHub fine-grained token. |

The token is stored encrypted with `TOKEN_ENCRYPTION_KEY` and never shown again. Leave the field
empty to keep the stored token, or tick "Remove the stored token" to drop it. When the Git URL
moves to another server, grimoire asks for the token again, so a stored token never goes to a
server it was not entered for.

**Test connection** asks the Git server whether grimoire can read the source: it answers, it
accepts the username and token, and the branch exists. It shows the commit the branch is at, or
why it failed: the server cannot be reached, access is refused or there is no repository at the
URL, or the branch does not exist. Whether the path exists only shows on the first sync. Saving
runs the same check whenever the Git URL, branch, username or token changed, and a new source or
project is not saved until it passes; changing anything else saves without asking the server.

#### Tokens per Git host

| Git host | Username | Token |
|---|---|---|
| GitLab | The username of the deploy token, as GitLab shows it when the token is created | A deploy token with the scope `read_repository` (Settings → Repository → Deploy tokens), starting with `gldt-` |
| GitHub | The name of the account the token belongs to; GitHub identifies the account by the token and accepts any username with it | A fine-grained personal access token limited to the repository, with the permission Contents: read-only (Settings → Developer settings → Personal access tokens → Fine-grained tokens), starting with `github_pat_` |
| Forgejo | The name of the account the token belongs to; Forgejo identifies the account by the token and accepts any username with it | An access token of that account with read access to repositories (Settings → Applications → Access tokens) |

On all three, a token the Git server refuses, because it is wrong, expired or revoked, or may not
read the repository, shows at **Test connection** and as sync error of the source as `the Git
server refused the username and token`. A source without a token whose repository is private, or
missing, shows `the Git server asks for a username and token`. Neither message contains the token
or the username.

Saving a source starts a sync right away, so a changed path or exclusion applies without waiting
for a new commit; a paused source is saved without one. Deleting a project deletes its sources and their index.

### Changing a slug

A slug can be changed under **Change the slug** at the bottom of the project or source page. It
works like renaming a namespace: every snippet ID changes, so IDs an agent has kept and URLs such
as `/p/<slug>/query` in an agent's configuration stop working, for a project in all its sources.
The page says so, and the change only goes through once you type the current slug as
confirmation and the new one is free. It takes effect at once: search, `read` and the links
between pages answer with the new IDs without a sync.

## Status and sync

The start page of the management area adds up projects, sources, pages, snippets, tokens, dead links
and API keys, and lists under "Needs attention" every source with a sync error, sync warnings or
no sync yet, linked to its page. Below that, each project shows the same figures as the public
start page.

The number of dead links leads to a list of all of them, grouped by project and source, each
group linked to its source.

The page of a project lists its sources each with the time of its last sync, or "never synced",
and with its sync error and the number of its warnings, so a failing source shows without opening
every one.

The page of a source shows when it was last checked and synced, the commit, and how many pages,
snippets and tokens it holds. A sync that failed shows its error; the index of the last
successful sync stays in use until the next one succeeds. Pages that could not be processed are
listed as warnings, and links that lead nowhere as dead links, each with the page and section
it is on.

The **Sync history** below lists the recent runs of the source, newest first: when, whether it
synced, found the branch unchanged or failed, the commit and the error. Runs that repeat the one
before, unchanged at the same commit or failing with the same error, are counted in one line with
the time of the first and the last, so the history shows since when a source has been failing
even with polling every few minutes. The newest 100 lines per source are kept.

The pages can be filtered by file path and title. Every page links to a preview: the page exactly as the agent operation `read` returns it, split
into its snippets with their `Source:` and `Edit:` lines. Each snippet is listed with its title
path, its ID and its estimated tokens, so a section that came out too large, too small or under a
misleading title shows up before an agent meets it. A page without any snippet says so.

**Sync now** queues a sync of the source, even when the branch has not moved, and returns right
away. It runs after the syncs queued before it; until it is done the page says that a sync is
queued or running, and refreshes every two seconds until it shows the outcome: the time of the
last sync, the commit, and the error if it failed. Without JavaScript, reload the page instead.

Pause a source while its repository moves, its token is being replaced or its Git server is
down for maintenance: polling then leaves it alone instead of collecting the same error at every
check. Its index, schedule and settings stay; **Sync now** still syncs it once without resuming
it. Untick "Paused" to resume it, and polling syncs it again when its schedule next comes due.
The page of the source and the source list of the project show that it is paused.

## Trying a query

**Try a query** answers a question exactly as the agent operation `query` does over HTTP and MCP:
the matching snippets in ranking order, as many as fit the token budget, and a line naming the IDs
of the hits that did not fit. Leave the project at "All projects" to search everything, or pick one.
No API key is involved; every project is searched. Use it to check whether a page is found for the
words agents ask with, and how much of it fits the budget they send. The result has its own
address, so a query can be shared as a link.

## Queries without results

**Queries without results** lists the questions agents asked with `query`, over HTTP or MCP, that
found nothing: each question once per project, with how often and when it was last asked. Such a
question means the documentation lacks the topic or calls it something else; full-text search
knows no synonyms. A question opens in **Try a query**, to check it again after the docs changed.

grimoire stores the question as the agent sent it, so it may contain whatever the agent put in it.
Entries are deleted after 30 days, and beyond the newest 10,000. Queries from **Try a query** and
requests for an unknown project are not recorded.

## Settings

**Settings** in the management area hold what applies to the whole instance. They are stored in the
database and survive a restart.

**Pause all syncs** stops polling for every source at once, for example while a Git server is under
maintenance or access tokens are being replaced. It takes precedence over the sources without
changing them: a source keeps its own schedule and its own "Paused", and saving a source while all
syncs are paused starts no sync. A sync already running when you pause finishes. **Sync now** still syncs a source once. Untick the setting to
resume: every source is polled by its own settings again, and one paused on its own stays paused.
The admin start page and the page of every source show that all syncs are paused.

## API keys

Agents authenticate with an API key, sent as `Authorization: Bearer <key>`. Under **API keys**,
create one with a name and the projects it may read: all of them, including projects added
later, or a selection.

The key is shown once, right after it is created; **Copy key** puts it on the clipboard. grimoire stores only its SHA-256 hash, so a
lost key cannot be recovered: revoke it and create a new one. Revoking takes effect with the next
request. A key limited to a selection loses a project when the project is deleted, and sees
nothing once all of them are gone.

The list shows when each key last authenticated a request, to the minute, or that it was never
used: a key unused for long is a candidate for revoking. **Change** next to a key edits the
projects it may read and how long it is valid without replacing the key, so the agents using it
need no new one.

A key can be valid until a date, for a trial or a contractor. It works through that day in the
time zone of the instance (`TZ`) and is rejected from the next day on, like an unknown key; the
list shows it as expired until it is revoked or given a later date. Without a date a key never
expires.

## Lost password

When grimoire can send mail (`SMTP_HOST` and `BASE_URL` set, see
[Environment](docker.md#environment)), the login page offers **Forgot your password?**
(`/login/forgot`). It asks for the email address and sends a link to it that sets a new password;
the answer is the same whether the address has an account or not. The link is valid for one hour
and works once. Setting the new password ends every session of that user and voids their other
links. One client may ask 5 times an hour, and one address gets at most 3 links an hour; further
requests for it are answered as usual but send nothing. The link points to `BASE_URL`, never to
the host the request named: otherwise anyone could request a link for someone else's address
that leads to their own server.

Without SMTP the login page offers none of this, and `/login/forgot` answers `404`.

Without mail, or for the last admin who cannot receive it, delete the admin account with the
script in the container:

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

It asks for the email address of a user with the role `admin` and deletes that user, together
with their sessions, only when the address matches; without a terminal (no `-it`) it refuses to run.
grimoire keeps running. When no other user has the role `admin`, it logs `Admin account was reset.`
and a new setup token, and the management area offers the setup again.

The script cannot be protected by a password of its own: whoever can run commands in the
container can read the database anyway. What protects the admin account is who may use
`docker exec` or `kubectl exec`.

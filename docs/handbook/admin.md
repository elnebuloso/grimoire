# Management area

!!! info "Prerequisites"
    - Reader: admin.
    - Required permissions: the admin account, set up once at the first start.

    New to grimoire? Read [Concepts](index.md) first.

## First start

While no admin exists, every page of the management area leads to `/setup`. You need the setup
token from the server log; ask the operator for it (see [Setup token](docker.md#setup-token)). A
token from before a restart no longer works.

The address you enter is your login, in any letter case. The password needs at least 12
characters.

## Logging in

- A login lasts 12 hours.
- A client address may fail at most 10 times in any 15 minutes; beyond that every login from it
  gets `Too many failed logins. Try again later.`, also with the right password. Wait 15 minutes.
  A wrong current password under **Change the password** counts as a failed login.
  IPv6 addresses of one `/64` network count as one client address.
- The same message appears for everybody while the server is busy checking many logins at once.
  Try again after a moment.
- The interface follows the browser's language, English otherwise, until you pick one with the
  language switch; the choice is kept in a cookie. Sync errors and warnings are always in English.
- The colours follow the light or dark setting of your system until you pick **Light** or
  **Dark** under **Theme**; the choice is kept in a cookie for 400 days in this browser.
  **System** follows the system again.

For a login that is accepted and then asked for again, or forms failing with
`Cross-site POST form submissions are forbidden`, the operator has to fix the proxy (see
[Reverse proxy](docker.md#reverse-proxy)).

## Changing the password

`Manage > Change the password`. The new password needs at least 12 characters. All your other
sessions are logged out; the browser you changed it in stays logged in.

## Forgot your password?

!!! info "Available when"
    The operator has set up mail. Otherwise the login page offers no
    **Forgot your password?**; ask the operator (see [Lost admin password](docker.md#lost-admin-password)).

- The link is valid for one hour and works once. Setting the password ends every session of the
  account and voids its other links.
- The answer is the same whether the address has an account or not.
- One address receives at most 3 links an hour; requests beyond that are answered as usual but
  send nothing. One client may request 5 links an hour; beyond that it gets
  `Too many requests for a new password. Try again later.`
- `This link is invalid, used or expired. Request a new one.`: use **Request a new link**.

## Sources

Create a source with **New source** on `Manage > Overview`.

!!! note "Public"
    The start page `/` shows every source's name, slug and short description without a login,
    with whether it is public or private, its counts of pages, snippets, tokens and dead links, its
    last sync and whether it has a sync error. It shows neither Git URLs nor error texts. For
    public sources it links the **Documentation** site and offers **Try a query** to everyone,
    searching the public sources only.

To serve two paths of one repository, add it twice, as two sources, and name each for what it
holds, such as `Billing API` and `Billing runbooks`.

| Field | Rule |
|---|---|
| **Name** | At most 80 characters. Creating derives the slug from it: lowercase letters, digits and single hyphens, umlauts spelled out (`Prüfung & Abnahme` → `pruefung-abnahme`), at most 40 characters. Renaming keeps the slug. A slug is unique on the instance. |
| **Short description** | Optional. Agents see it in `sources` and use it to choose where to search: name what the documentation covers, such as `Login, sessions and tokens of the auth service`. |
| **Git URL (HTTPS)** | `https://` only. Username and token go in their own fields, never in the URL. |
| **Documentation site** | Optional. Linked on the source page, and for a public source on the start page; agents do not see it. |
| **Path in the repository** | Relative to the repository root, such as `docs`; a trailing slash is dropped; empty for the whole repository; no `..`. |
| **Exclusions** | Glob patterns relative to the repository root, one per line, such as `docs/drafts/**`. |
| **Schedule** | Cron with five fields in the instance's time zone, such as `0 6 * * 1-5` for weekdays at 6:00; empty uses the global schedule the label shows. A schedule that never runs, such as `0 0 30 2 *`, is rejected. |
| **Public** | Off for a new source. On, anyone who can reach grimoire searches and reads the source without an API key, over MCP and HTTP; content read in the meantime cannot be taken back by switching it off. Off, only API keys for all sources or for this one read it. |
| **Paused** | Polling skips the source; only **Sync now** syncs it. |
| **Username**, **Access token** | A read-only token of the Git host, see the table below. |

### Access tokens per Git host

| Git host | Username | Token |
|---|---|---|
| GitLab | The deploy token's username, as GitLab shows it on creation | Deploy token with scope `read_repository` (`Settings > Repository > Deploy tokens`), starting with `gldt-` |
| GitHub | The name of the token's account; any username works | Fine-grained personal access token for the repository, `Contents: read-only` (`Settings > Developer settings > Personal access tokens > Fine-grained tokens`), starting with `github_pat_` |
| Forgejo | The name of the token's account; any username works | Access token with read access to repositories (`Settings > Applications > Access tokens`) |

- A stored token is never shown again. Leave the field empty to keep it, or tick
  **Remove the stored token**.
- When the Git URL moves to another server, enter the token again or remove it
  (`The Git URL points to another server: enter the token again or remove it.`); a token never goes
  to a server it was not entered for.

### Test connection

**Test connection** checks that the Git server answers, accepts the username and token, and has
the branch. Saving runs the same check whenever Git URL, branch, username or token changed, and a
new source is saved only when it passes. Whether the path exists shows on the first
sync.

| Message | Fix |
|---|---|
| `Reachable: branch main is at commit 3f2a9c1d8e4b.` | Nothing. |
| `The repository has no branch main.` | Correct **Branch**. |
| `Access refused, or there is no repository at this URL: …` | Check the Git URL, then the token and its scope. |
| `The Git server cannot be reached: …` | Check the host name; a firewall or a Git server down is outside grimoire. |
| `The stored access token cannot be decrypted with the current key. Enter the token again or remove it.` | Enter the token again, or tick **Remove the stored token**. |

### After saving

Saving a source indexes it again when Git URL, branch, path or exclusions changed, or its last
sync failed; those changes apply without a new commit. Any other change only checks the branch for
a new commit, so other sources do not wait behind a full index. A paused source, or any source
while **Pause all syncs** is on, is saved without either.

!!! danger "Irreversible"
    Deleting a source deletes its index. API keys limited to a deleted source lose it.

### Changing a slug

`Change the slug`, at the bottom of a source page.

!!! warning "Breaks references"
    Every ID below the slug changes at once. IDs agents have kept and URLs such as
    `/sources/<slug>` or `/query?source=<slug>` in agent configurations stop working. Search,
    `read` and links between pages answer with the new IDs right away.

Confirm by typing the current slug. The new slug must be free.

## Sync errors

A failed sync keeps the index of the last successful one in use and shows its error on the source
page and under **Needs attention**.

| Error | Fix |
|---|---|
| `the Git server refused the username and token: wrong, expired or revoked, or without access to this repository` | Create a new token (see [Access tokens per Git host](#access-tokens-per-git-host)) and enter it. |
| `the Git server asks for a username and token: the repository is private, or there is none at this URL` | Enter a username and token, or correct the Git URL. |
| `branch "main" not found in https://…` | Correct **Branch**. |
| `source path "docs" does not exist in the repository` | Correct **Path in the repository**. |
| `no page could be indexed, docs/deploy.md: skipped, …`, or another reason a page was skipped | Every page was skipped, so the previous index stays. Ask the authors to fix what the message names (see [Writing documentation](writing.md#sync-warnings)). |
| `invalid cron expression "0 25 * * *": …` | Correct **Schedule**. |
| `the stored access token cannot be decrypted with the current key: …` | Enter the token again, or remove it. The instance's encryption key is not the one the token was stored with, or the stored value is damaged. If every source with a token shows this, ask the operator whether the key was replaced. |
| `indexing took longer than 10 minutes` | Split the source into smaller paths, ask authors to look for a huge or generated page, or ask the operator for a longer indexing deadline (see [Memory and CPU limits](docker.md#memory-and-cpu-limits)). |
| `indexing ended with … before it finished, out of memory for example` | Ask the operator for more memory (see [Memory and CPU limits](docker.md#memory-and-cpu-limits)). |

When indexing fails, that commit is not indexed again: checks keep showing the error until the
branch moves on. **Sync now** and saving the source try the same commit again.

A Git server that does not answer within 30 seconds is skipped until the next scheduled check and
shows as error. Warnings about single pages and includes are for the authors; they explain them on
[Writing documentation](writing.md#sync-warnings).

## Syncing

- A check asks only for the branch head, at most 15 seconds after its scheduled time; the source is
  cloned only when the branch moved.
- Up to four sources are checked at once; one is cloned and indexed at a time.
- A check missed while grimoire was stopped runs once when it starts again.
- While a source syncs, agents get answers from its previous index.

**Sync now** queues a sync even when the branch has not moved, behind the syncs queued before it.
The page shows the outcome when it is done.

**Paused** on a source stops polling for it, for example while its repository moves or its token
is replaced; index, schedule and settings stay. `Manage > Settings > Pause all syncs` does the
same for every source without changing them: a source paused on its own stays paused when you
untick it. A sync already running finishes. **Sync now** works in both cases.

**Sync history** on the source page collapses repeats, unchanged at the same commit or failing with
the same error, into one line with the first and last time, so it shows since when a source fails.
It keeps the newest 100 lines.

## Checking what agents get

- **Dead links**, opened from the count of dead links on `Manage > Overview`, lists links that lead
  nowhere, by source; authors fix them in Git.
- Every page of a source links to a preview: the page exactly as `read` returns it, split into
  snippets with ID and estimated tokens. Use it to find sections that came out too large, too small
  or under a misleading title.
- `Manage > Try a query` answers exactly like the agent operation `query`, with a line naming the
  hits that did not fit the budget. It searches every source, or the ones ticked, needs no API key and is not recorded.
  Its address can be shared as a link.

## Queries without results

`Manage > Queries without results` lists questions agents asked with `query` that found nothing,
once per set of sources asked for, with how often and when last. Search matches words, not synonyms: such a question
means the documentation lacks the topic or names it differently. Open a question in
**Try a query** to check it again after the docs changed.

- Questions are stored as the agent sent them, up to 500 characters, and may contain whatever the
  agent put in.
- Entries are deleted after 30 days and beyond the newest 10,000.
- Questions naming an unknown source are not recorded, nor questions sent without an API key.

## API keys

`Manage > API keys`. A key reads all sources, including future ones, or a selection; public sources need no key.

- The key is shown once, right after **Create key**; grimoire cannot show it again. A lost key
  cannot be recovered: revoke it and create a new one.
- **Revoke** takes effect with the next request.
- **Change** followed by the key's name edits sources and expiry without replacing the key;
  agents keep using it.
- **Valid until** is optional. The key works through that day in the instance's time zone and is
  rejected from the next day on; the list shows it as expired.
- The list shows when a key last authenticated a request, to the minute. Revoke keys unused for a
  long time.
- A key limited to a selection loses a source when it is deleted; once all are gone, it reads the
  public sources only, like a request without a key.

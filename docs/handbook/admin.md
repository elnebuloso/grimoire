# Management area

!!! info "Prerequisites"
    - Reader: admin.
    - Required permissions: the admin role. The first admin account is set up at the first start;
      further admins are users an admin made admin.

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
  language switch; the choice is kept in a cookie for 400 days. Sync errors and warnings are always in English.
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

!!! note "Shown on the start page"
    The start page `/` lists the public sources to everyone, and to a logged-in user also the
    internal ones and their own private ones: name, slug, short description, visibility, counts of
    pages, snippets, tokens and dead links, last sync and whether it has a sync error. It shows
    neither Git URLs nor error texts. For public sources it links the **Documentation** site and
    offers **Try a query**, which searches what the viewer may read.

You manage every source: the overview lists all of them, also other users' private ones, and you
may change, sync, rename and delete each. A source you create is yours; users manage their own
(see [Your sources and API keys](users.md#sources)).

To serve two paths of one repository, add it twice, as two sources, and name each for what it
holds, such as `Billing API` and `Billing runbooks`. The same repository and path cannot be added a
second time, not even on another branch; what counts as the same and the messages are under
[Documentation that is already registered](users.md#documentation-that-is-already-registered).
Unlike users, you see the name of the other source in the message, private ones included.

| Field | Rule |
|---|---|
| **Name** | At most 80 characters. Creating derives the slug from it: lowercase letters, digits and single hyphens, umlauts spelled out (`Prüfung & Abnahme` → `pruefung-abnahme`), at most 40 characters. Renaming keeps the slug. A slug is unique on the instance. |
| **Short description** | Optional. Agents see it in `sources` and use it to choose where to search: name what the documentation covers, such as `Login, sessions and tokens of the auth service`. |
| **Git URL (HTTPS)** | `https://` only: the clone URL of the repository, usually ending in `.git`. Username and token go in their own fields, never in the URL. |
| **Documentation site** | Optional. Linked on the source page, and for a public source on the start page; agents do not see it. |
| **Path in the repository** | Relative to the repository root, such as `docs`; a trailing slash is dropped; empty for the whole repository; no `..`. |
| **Exclusions** | Glob patterns relative to the repository root, one per line, such as `docs/drafts/**`. |
| **Schedule** | Cron with five fields in the instance's time zone, such as `0 6 * * 1-5` for weekdays at 6:00; empty uses the global schedule the label shows. A schedule that never runs, such as `0 0 30 2 *`, is rejected. |
| **Visibility** | **Private** for a new source: only the owner's API keys read it, an admin's keys neither. **Internal**: the API key of every user. **Public**: anyone who can reach grimoire, without an API key, over MCP and HTTP. Content read in the meantime cannot be taken back by choosing a narrower level. |
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
| `The Git server redirects this URL to <url>. Enter that as Git URL, then test or save again.` | Enter the URL named as **Git URL**. GitLab redirects a project path without `.git`, and the old path of a moved project. grimoire never follows a redirect itself: a moved path can later lead to another project. |
| `The Git server redirects this URL elsewhere (HTTP 301). …` | The target is on another host, or could not be asked. Copy the clone URL from the **Clone** button of the repository, usually ending in `.git`. |
| `The stored access token cannot be decrypted with the current key. Enter the token again or remove it.` | Enter the token again, or tick **Remove the stored token**. |
| `The server may not connect to <host>. If it is your organisation's Git server, ask the person running grimoire to add it to GIT_ALLOWED_HOSTS.` | The address is an IP address, uses another port than 443, or leads into an internal network, or the instance runs behind a proxy. Ask the operator to allow the host (see [Git servers](docker.md#git-servers)). |

### After saving

Saving a source indexes it again when Git URL, branch, path or exclusions changed, or its last
sync failed; those changes apply without a new commit. Any other change only checks the branch for
a new commit, so other sources do not wait behind a full index. A paused source, or any source
while **Pause all syncs** is on, is saved without either.

!!! danger "Irreversible"
    Deleting a source deletes its index, also of a source another user owns. API keys limited to a
    deleted source lose it.

### Duplicate sources

`Manage > Duplicate sources` lists every pair of sources that hold the same documentation, judged
by the same rule as saving a source:

- **Duplicate**: same repository and path, on any branch, created before the check existed. Keep
  one: delete the other, after moving any API key limited to it. Agents find every page of a
  duplicate twice until then.
- **Overlap**: one path inside the other. Saved by someone who confirmed the warning, or from
  before the check. Exclude the inner directory in the outer source, such as `docs/api/**`, or
  leave both if the inner part needs a visibility or owner of its own.

The list names private sources of every user; only admins open it.

### Changing a slug

`Change the slug`, at the bottom of a source page.

!!! warning "Breaks references"
    Every ID below the slug changes at once. IDs agents have kept and URLs such as
    `/sources/<slug>` or `/query?source=<slug>` in agent configurations stop working. Search,
    `read` and links between pages answer with the new IDs right away.

The new slug must be free.

## Sync errors

A failed sync keeps the index of the last successful one in use and shows its error on the source
page and under **Needs attention**.

| Error | Fix |
|---|---|
| `the Git server refused the username and token: wrong, expired or revoked, or without access to this repository` | Create a new token (see [Access tokens per Git host](#access-tokens-per-git-host)) and enter it. |
| `the Git server asks for a username and token: the repository is private, or there is none at this URL` | Enter a username and token, or correct the Git URL. |
| `branch "main" not found in https://…` | Correct **Branch**. |
| `the Git server redirects this URL elsewhere (HTTP 301): …` | Run **Test connection** on the source page: it names the URL to enter where it can. Otherwise copy the clone URL from the **Clone** button of the repository. |
| `The server may not connect to <host>. If it is your organisation's Git server, ask the person running grimoire to add it to GIT_ALLOWED_HOSTS.` | The address is an IP address, uses another port than 443, or leads into an internal network, or the instance runs behind a proxy. Ask the operator to allow the host (see [Git servers](docker.md#git-servers)). |
| `source path "docs" does not exist in the repository` | Correct **Path in the repository**. |
| `no page could be indexed, …` | Every page was skipped, so the previous index stays; the message ends with the last reason. Ask the authors to fix what the message names (see [Writing documentation](writing.md#sync-warnings)). |
| `invalid cron expression "0 25 * * *": …` | Correct **Schedule**. |
| `the stored access token cannot be decrypted with the current key: …` | Enter the token again, or remove it. The instance's encryption key is not the one the token was stored with, or the stored value is damaged. If every source with a token shows this, ask the operator whether the key was replaced. |
| `indexing took longer than 10 minutes`, or the deadline set | Split the source into smaller paths, ask authors to look for a huge or generated page, or ask the operator for a longer indexing deadline (see [Memory and CPU limits](docker.md#memory-and-cpu-limits)). |
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

**Paused** on a source stops polling for it, for example while its repository moves or its token
is replaced; index, schedule and settings stay. `Manage > Settings > Pause all syncs` does the
same for every source without changing them: a source paused on its own stays paused when you
untick it. A sync already running finishes. **Sync now** works in both cases.

**Sync history** on the source page collapses repeats, unchanged at the same commit or failing with
the same error, into one line with the first and last time, so it shows since when a source fails.
It keeps the newest 100 lines.

## Checking what agents get

- `Manage > Dead links` lists links that lead nowhere, by source; authors fix them in Git.
- Every page of a source links to a preview: the page exactly as `read` returns it, split into
  snippets with ID and estimated tokens. Use it to find sections that came out too large, too small
  or under a misleading title.
- **Try a query** on the start page answers exactly like the agent operation `query`, with a line
  naming the hits that did not fit the budget. Logged in, it searches every source your own API
  keys would read, not other users' private sources; it needs no API key and is not recorded.
  Its address can be shared as a link.

## Queries without results

`Manage > Queries without results` lists questions agents asked with `query` that found nothing,
once per set of sources asked for, with how often and when last. Search matches words, not synonyms: such a question
means the documentation lacks the topic or names it differently. Open a question in
**Try a query** on the start page to check it again after the docs changed; it searches all your
sources, not only the ones the agent asked for.

- Questions are stored as the agent sent them, up to 500 characters, and may contain whatever the
  agent put in.
- Entries are deleted after 30 days and beyond the newest 10,000.
- Questions naming an unknown source are not recorded, nor questions sent without an API key.
- Users see the questions that named one of their own sources; questions across all sources only
  admins see.

## API keys

Your own keys: `Manage > My API keys`, as for every user (see
[API keys](users.md#api-keys)).

`Manage > All API keys` lists every key with its owner, sources, last use and requests per day
for the last 90 days. **Revoke** stops a key with the next request, whoever owns it; only the owner
changes its sources or expiry. Revoke keys that leaked or have not been used for a long time.

## Users

`Manage > Users`.

### Inviting

Enter the address and **Send invitation**. The invited person chooses a password through the link
and has an account without the admin role.

- With mail set up, the link goes out by mail. Without mail, or when the mail server refuses it,
  the page shows the link once, to send yourself; grimoire cannot show it again.
- The link works once and for 7 days. **Pending invitations** shows when it was sent and marks it
  as expired after that.
- **Send again** replaces the link and its 7 days; the link sent before stops working.
  **Withdraw** stops it without a new one.
- `This email address already has an account.`, `An invitation to this address is waiting already;
  send it again from the list.`: nothing to invite; use **Send again** for the waiting one.

### Roles

**Make admin** gives a user everything this page describes. **Remove admin role** leaves the
account, its sources and keys as they are.

`The last admin keeps the role: make another user an admin first.`: an instance without admin
offers the setup again to whoever has the server log, so the last one stays.

### Deleting a user

!!! danger "Irreversible"
    The user's sources become yours, their API keys stop working at once, their sessions end.
    The account cannot be restored; invite the address again to give it a new one.

Your own account cannot be deleted here (`You cannot delete your own account.`), nor the last
admin.


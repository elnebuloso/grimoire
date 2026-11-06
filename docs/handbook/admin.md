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

- A login ends after 60 minutes without a page view or form submit, and 12 hours after you logged
  in whatever you do. A page refreshing on its own, such as a source waiting for its sync, does
  not keep it alive. Log in again and you land on the page you asked for; what you typed into
  a form before the login ended is lost.
- A client address may fail at most 10 times in any 15 minutes; beyond that every login from it
  gets `Too many failed logins. Try again later.`, also with the right password. Wait 15 minutes.
  A wrong current password under **Change the password** counts as a failed login.
  IPv6 addresses of one `/64` network count as one client address.
- The same message appears for everybody while the server is busy checking many logins at once.
  Try again after a moment.
- **Language** and **Theme** are in the menu under your address at the top right; before you
  log in, at the bottom of the page.
- The interface follows the browser's language, English otherwise, until you pick one under
  **Language**; the choice is kept in a cookie for 400 days. Sync errors and warnings are always
  in English.
- The colours follow the light or dark setting of your system until you pick **Light** or
  **Dark** under **Theme**; the choice is kept in a cookie for 400 days in this browser.
  **System** follows the system again.

For a login that is accepted and then asked for again, or forms failing with
`Cross-site POST form submissions are forbidden`, the operator has to fix the proxy (see
[Reverse proxy](docker.md#reverse-proxy)).

## Changing the password

**Login and password** in the menu under your address. The new password needs at least 12 characters. All your other
sessions are logged out; the browser you changed it in stays logged in.

## Forgot your password?

!!! info "Available when"
    The operator has set up mail. Otherwise the login page offers no
    **Forgot your password?**; ask the operator (see [Lost admin access](docker.md#lost-admin-access)).

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
    internal ones: name, slug, short description, visibility, counts of pages, snippets and
    tokens, and the time of the last successful sync, or `Not available yet`. Sync errors,
    paused polling and dead links show only here in the management area. For public sources it
    links the **Documentation** site; for admins every name leads to the source's management
    view. **Try a query** searches what the viewer may read.

Only admins add, change, sync, rename and delete sources; users read them and create their own API
keys (see [Your account and API keys](users.md)).

`Management > Content > Sources` lists every source and starts **New source**. This list, the
users, all API keys and the queries without results show 100 rows a page; search, filters, sort and
page stand in the address, so a filtered list can be bookmarked or sent to someone. A source opens on
its **Status**; **Pages**, **History** and **Settings** are tabs beside it, and **Delete source**
sits under **Danger zone** on **Settings**. The numbers beside
the sidebar entries count what needs you: sources with a sync error, dead links, duplicate pairs
and invitations not yet accepted.

To serve two paths of one repository, add it twice, as two sources, and name each for what it
holds, such as `Billing API` and `Billing runbooks`. The same repository and path cannot be added a
second time, not even on another branch; what counts as the same and the messages are under
[Documentation that is already registered](#documentation-that-is-already-registered).

The form of a source groups its fields into **General**, **Repository**, **Access** and
**Schedule and visibility**; **Test connection** sits at the end of **Access**.

| Field | Rule |
|---|---|
| **Name** | At most 80 characters. Creating derives the slug from it: lowercase letters, digits and single hyphens, umlauts spelled out (`Prüfung & Abnahme` → `pruefung-abnahme`), at most 40 characters. Renaming keeps the slug. A slug is unique on the instance. |
| **Short description** | Optional. Agents see it in `sources` and use it to choose where to search: name what the documentation covers, such as `Login, sessions and tokens of the auth service`. |
| **Git URL (HTTPS)** | `https://` only: the clone URL of the repository, usually ending in `.git`. Username and token go in their own fields, never in the URL. |
| **Documentation site** | Optional. Linked on the source page, and for a public source on the start page; agents do not see it. |
| **Path in the repository** | Relative to the repository root, such as `docs`; a trailing slash is dropped; empty for the whole repository; no `..`. |
| **Exclusions** | Glob patterns relative to the repository root, one per line, such as `docs/drafts/**`, at most 1,000 characters each. |
| **Schedule** | Cron with five fields in the instance's time zone, such as `0 6 * * 1-5` for weekdays at 6:00; empty uses the global schedule the label shows. The next three runs show below the field as you type; `Not a valid schedule yet.` there means saving will be refused. A schedule that never runs, such as `0 0 30 2 *`, is rejected. |
| **Visibility** | **Internal** for a new source: the API key of every user, and every user logged in on the start page. **Public**: anyone who can reach grimoire, without an API key, over MCP and HTTP and in **Try a query** on the start page. Switch either way at any time; content read while a source was public cannot be taken back by making it internal. |
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
the branch with the path as a directory; it needs no name yet. Saving runs the same check whenever
Git URL, branch, path, username or token changed, and saves only when it passes. A large repository
can take up to a minute.

| Message | Fix |
|---|---|
| `Reachable: branch main is at commit 3f2a9c1d8e4b.` | Nothing. |
| `The repository has no branch main.` | Correct **Branch**. |
| `The path docs does not exist on branch main.` | Correct **Path in the repository**: it is relative to the repository root and names a directory; leave it empty for the whole repository. |
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
    Deleting a source deletes its index. API keys limited to a deleted source lose it.

### Documentation that is already registered

One documentation is one source: two sources on the same repository and the same path are the same
documentation, whichever branches they follow. Spelling makes no difference: `.git` or a trailing
slash at the end of the Git URL, upper or lower case, `docs`, `docs/` or `./docs` all name the same.
Different versions of one documentation from different branches cannot be separate sources: a
source follows one branch; to read another version, change **Branch** of the existing source.

Creating or changing a source checks this when you save; a source whose Git URL and path you leave
as they are is saved without the check, even if it already has a duplicate.

| Message | Fix |
|---|---|
| `This documentation is already registered as "<name>": same repository and path. …` | Use the source named, or change its branch. Saving is not possible. |
| `The path overlaps with "<name>": one lies inside the other, …` | One path lies inside the other, such as `docs` and `docs/api`: the pages under `docs/api` would be found twice. Exclude the inner directory in the outer source (`docs/api/**` under **Exclusions**), or tick **Save anyway, although pages are indexed twice** and save again. |

### Duplicate sources

`Management > Quality > Duplicate sources` lists every pair of sources that hold the same documentation, judged
by the same rule as saving a source:

- **Duplicate**: same repository and path, on any branch, created before the check existed. Keep
  one: delete the other, after moving any API key limited to it. Agents find every page of a
  duplicate twice until then.
- **Overlap**: one path inside the other. Saved by someone who confirmed the warning, or from
  before the check. Exclude the inner directory in the outer source, such as `docs/api/**`, or
  leave both if the inner part needs a visibility of its own.

### Changing a slug

`Change the slug`, under **Danger zone** on the **Settings** tab of a source.

!!! warning "Breaks references"
    Every ID below the slug changes at once. IDs agents have kept and URLs such as
    `/sources/<slug>` or `/query?source=<slug>` in agent configurations stop working. Search,
    `read` and links between pages answer with the new IDs right away.

The new slug must be free.

## Sync errors

A failed sync keeps the index of the last successful one in use and shows its error on the source
page and under **Needs attention** in `Management > Overview`.

Above the error stands a summary of its kind; the error itself is in English and names the
detail.

| Summary | Error, for example | Fix |
|---|---|---|
| `The Git server refused access.` | `the Git server refused the username and token: wrong, expired or revoked, or without access to this repository` | Create a new token (see [Access tokens per Git host](#access-tokens-per-git-host)) and enter it. |
| `The Git server refused access.` | `the Git server asks for a username and token: the repository is private, or there is none at this URL` | Enter a username and token, or correct the Git URL. |
| `The Git server refused access.` | `the stored access token cannot be decrypted with the current key: …` | Enter the token again, or remove it. The instance's encryption key is not the one the token was stored with, or the stored value is damaged. If every source with a token shows this, ask the operator whether the key was replaced. |
| `The branch was not found in the repository.` | `branch "main" not found in https://…` | Correct **Branch**. |
| `The Git server redirects this URL elsewhere.` | `the Git server redirects this URL elsewhere (HTTP 301): …` | Run **Test connection** on the **Settings** tab of the source: it names the URL to enter where it can. Otherwise copy the clone URL from the **Clone** button of the repository. |
| `grimoire may not connect to this Git server.` | `The server may not connect to <host>. …` | The address is an IP address, uses another port than 443, or leads into an internal network, or the instance runs behind a proxy. Ask the operator to allow the host (see [Git servers](docker.md#git-servers)). |
| `The host name of the Git server does not resolve.` | `git.acme.example has no address`, `getaddrinfo ENOTFOUND git.acme.example` | Check the host name in the Git URL. If it is right, ask the operator whether the instance can resolve internal names. |
| `The Git server could not be reached.` | `git ls-remote failed: no answer within 30 s` | Check the Git URL. If it is right, **Sync now** tries again. |
| `The path does not exist in the repository.` | `source path "docs" does not exist in the repository` | Correct **Path in the repository**. |
| `No page could be indexed.` | `no page could be indexed, …` | Every page was skipped, so the previous index stays; the message ends with the last reason. Ask the authors to fix what the message names (see [Writing documentation](writing.md#sync-warnings)). |
| `Indexing took too long.` | `indexing took longer than 10 minutes`, or the deadline set | Split the source into smaller paths, ask authors to look for a huge or generated page, or ask the operator for a longer indexing deadline (see [Memory and CPU limits](docker.md#memory-and-cpu-limits)). |
| `Indexing stopped before it finished.` | `indexing ended with … before it finished, out of memory for example` | Ask the operator for more memory (see [Memory and CPU limits](docker.md#memory-and-cpu-limits)). |
| none | `invalid cron expression "0 25 * * *": …` | Correct **Schedule**. |

When indexing fails because of the commit's content (no page could be indexed, the source path is
missing, indexing ran past its time limit or out of memory), that commit is not indexed again:
checks keep showing the error until the branch moves on. **Sync now** and saving the source try the
same commit again. Any other failure while indexing, such as the Git server not answering, is
retried at the next check.

A Git server that does not answer within 30 seconds is skipped until the next scheduled check and
shows as error. Warnings about single pages and includes are for the authors; they explain them on
[Writing documentation](writing.md#sync-warnings).

## Syncing

- A check asks only for the branch head, at most 15 seconds after its scheduled time; the source is
  cloned only when the branch moved.
- Up to four sources are checked at once; one is cloned and indexed at a time.
- A check missed while grimoire was stopped runs once when it starts again.
- While a source syncs, agents get answers from its previous index.

**Sync now**, at the top of every tab of a source, queues a sync even when the branch has not moved,
behind the syncs queued before it. The source shows `syncing…` until it ends, and a message tells
whether it succeeded.

**Paused** on a source stops polling for it, for example while its repository moves or its token
is replaced; index, schedule and settings stay. `Management > System > Settings > Pause all syncs` does the
same for every source without changing them: a source paused on its own stays paused when you
untick it. A sync already running finishes. **Sync now** works in both cases.

The **History** tab of a source collapses repeats, unchanged at the same commit or failing with
the same error, into one line with the first and last time, so it shows since when a source fails.
It keeps the newest 100 lines.

## Checking what agents get

- `Management > Quality > Dead links` lists links that lead nowhere, by source; authors fix them in Git.
- On the **Pages** tab of a source, every page links to a preview: the page exactly as `read` returns it, split into
  snippets with ID and estimated tokens. Use it to find sections that came out too large, too small
  or under a misleading title.
- **Try a query** on the start page shows each hit with its title path, ID and text, and how many
  hits did not fit the budget; **Raw answer, as an agent gets it** holds the answer exactly as the
  agent operation `query` returns it. Logged in, it searches every public and internal
  source; it needs no API key and is not recorded.
  Its address can be shared as a link.

## Queries without results

`Management > Quality > Queries without results` lists questions agents asked with `query` that found nothing,
once per set of sources asked for, with how often and when last. Search matches words, not synonyms: such a question
means the documentation lacks the topic or names it differently. Open a question in
**Try a query** on the start page to check it again after the docs changed; it searches all
sources, not only the ones the agent asked for.

- Questions are stored as the agent sent them, up to 500 characters, and may contain whatever the
  agent put in.
- Entries are deleted after 30 days and beyond the newest 10,000.
- Questions naming an unknown source are not recorded, nor questions sent without an API key.

## API keys

Your own keys: **Account** at the top, as for every user (see
[API keys](users.md#api-keys)).

`Management > Access > All API keys` lists every key with its owner, sources, expiry, last use and
requests per day for the last 90 days. The owner's address leads to that account under **Users**;
**Keys** there lists only that account's keys. **Revoke** stops a key with the next request, whoever owns it; only the owner
changes its sources or expiry. Revoke keys that leaked or have not been used for a long time.

## Users

`Management > Access > Users`. The tab **Users** lists the accounts, the tab **Invitations** the
invitations not yet accepted. **Make admin**, **Remove admin role**, **Password link** and
**Delete** sit in the **…** menu at the end of each account's row. **Keys** counts the account's
API keys and leads to them under **All API keys**.

### Inviting

**Invite user**, enter the address and **Send invitation**. The invited person chooses a password through the link
and has an account without the admin role.

- With mail set up, the link goes out by mail. Without mail, or when the mail server refuses it,
  the dialog shows the link once, to send yourself; grimoire cannot show it again.
- The link works once and for 7 days. **Invitations** shows when it was sent and marks it
  as expired after that.
- **Send again** replaces the link and its 7 days; the link sent before stops working. Without
  mail the action is called **Create new link** and shows the new link once.
  **Withdraw** stops it without a new one.
- `This email address already has an account.`, `An invitation to this address is waiting already;
  send it again from the list.`: nothing to invite; use **Send again** for the waiting one.

### Login methods

**Logs in with** shows whether a user has a password and which identity providers are linked;
`(no longer offered here)` marks a link to a provider the instance no longer configures.
**Remove** takes a link away and ends every session of theirs; on your own account, the browser you use stays logged in. It also removes the last way the
user logs in; the confirmation says so, and only a **Password link** lets them in again. Which providers exist and who gets an account through them is set by the operator
(see [Single sign-on](sso.md)).

### Password link

**Password link** creates a link for an account to set its password: for an account without
one, or a forgotten password when the instance sends no mail. With mail set up, the link goes to the
account's address and you never see it; without, it is shown once, to pass on yourself. It works
once, within 24 hours; a new link voids the earlier ones. The current password stays valid until
the link is used, and using it ends every session of the account. Whoever holds the link can take
over the account, admins included: pass it on only to its owner. Your own account has no such link;
change your password under **Login and password**. Each link is logged with who created it for whom.

### Roles

**Make admin** gives a user everything this page describes. **Remove admin role** leaves the
account and its keys as they are and closes the management area to it.

`The last admin keeps the role: make another user an admin first.`: an instance without admin
offers the setup again to whoever has the server log, so the last one stays.

### Deleting a user

!!! danger "Irreversible"
    The user's API keys stop working at once, their sessions end.
    The account cannot be restored; invite the address again to give it a new one.

Your own account cannot be deleted here (`You cannot delete your own account.`), nor the last
admin.


# Your sources and API keys

!!! info "Prerequisites"
    - Reader: user, with an account an admin invited you to.
    - Admins read this page too: everything here applies to their own sources and keys.

    New to grimoire? Read [Concepts](index.md) first.

## Accepting the invitation

The invitation comes by mail, or from the admin directly when the instance sends no mail. Its
link opens a form with your email address filled in; that address is your login. The password
needs at least 12 characters. Creating the account logs you in.

The link works once and for 7 days. A newer invitation to the same address replaces it. Logging
in, changing the password and a forgotten password work as described under
[Logging in](admin.md#logging-in).

`This invitation link is not valid: it was used, replaced by a newer one, withdrawn or is more
than 7 days old.`: ask an admin to send the invitation again.

## Sources

`Manage > New source`. A source you create is yours: you and the admins may change, sync, rename
and delete it; other users cannot open its page. The fields are explained under
[Sources](admin.md#sources) on the admin page.

**Visibility** decides who reads a source:

| Level | Read by |
|---|---|
| **Private** | API keys of the source's owner only. Admins manage the source but their keys do not read it. |
| **Internal** | The API key of every user of the instance. |
| **Public** | Anyone who can reach grimoire, without an API key, over MCP and HTTP and in **Try a query** on the start page. |

A new source is private. The start page lists a source to whoever may read it: public sources to
everyone, internal ones and your own private ones once you are logged in.

!!! warning "Cannot be taken back"
    What was read while a source was internal or public stays with whoever read it. Making it
    private again stops further reading only.

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
| `This documentation is already registered as "<name>": same repository and path. …` | Use the source named, or change its branch if it is yours. Saving is not possible. |
| `This documentation is already registered, as a private source of another user: …` | It is someone else's private source; you do not see which. Ask an admin who owns it, so it can be made internal. Saving is not possible. |
| `The path overlaps with "<name>": one lies inside the other, …` | One path lies inside the other, such as `docs` and `docs/api`: the pages under `docs/api` would be found twice. Exclude the inner directory in the outer source (`docs/api/**` under **Exclusions**), or tick **Save anyway, although pages are indexed twice** and save again. |
| `The path overlaps with a private source of another user: …` | As above, for a source you do not see; ask an admin, or save anyway. |

## In the management area

- The overview lists the sources you may read; only your own link to their page and count toward
  **Needs attention**.
- **Dead links** lists those of your own sources.
- **Queries without results** lists questions that named one of your own sources.
- **Try a query** on the start page searches every source your API keys would read.

## API keys

`Manage > My API keys`. A key reads all the sources you may read, including future ones, or a
selection of them; public sources need no key.

- The key is shown once, right after **Create key**. A lost key cannot be recovered: revoke it and
  create a new one.
- **Change** followed by the key's name edits sources and expiry without replacing the key.
- **Valid until** is optional. The key works through that day in the instance's time zone.
- A key never reads another user's private source. When its owner makes a source private, it
  drops out of your keys with the next request.
- Each key shows its requests per day for the last 90 days. Counts can lag a minute behind and
  lose that minute when the server restarts.
- Admins see every key with its owner, sources, last use and requests, and may revoke it.

Connecting an agent with the key: [Connecting agents](agents.md).

## When your account is deleted

An admin deletes accounts under **Users**. Your sources then belong to that admin, your API keys
stop working at once and your sessions end.

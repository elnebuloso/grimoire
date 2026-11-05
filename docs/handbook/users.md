# Your API keys

!!! info "Prerequisites"
    - Reader: user, with an account an admin invited you to.
    - Admins read this page too: everything here applies to their own keys.

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

## What you read

Logged in, the start page lists the public and the internal sources, and **Try a query** searches
them. Admins add sources and decide whether each is internal or public; to have a repository
added, ask an admin.

## API keys

**My API keys** in the header; admins find it under `Manage > My API keys`. A key reads all
sources, public and internal, including future ones, or a selection of them; public sources need
no key.

- The key is shown once, right after **Create key**. A lost key cannot be recovered: revoke it and
  create a new one.
- **Change** followed by the key's name edits sources and expiry without replacing the key.
- **Valid until** is optional. The key works through that day in the instance's time zone.
- Each key shows its requests per day for the last 90 days. Counts can lag a minute behind and
  lose that minute when the server restarts.
- Admins see every key with its owner, sources, last use and requests, and may revoke it.

Connecting an agent with the key: [Connecting agents](agents.md).

## When your account is deleted

An admin deletes accounts under **Users**. Your API keys stop working at once and your sessions
end.

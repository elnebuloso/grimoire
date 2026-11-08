# Your account and API keys

!!! info "Prerequisites"
    - Reader: user, with an account an admin invited you to.
    - Admins read this page too: everything here applies to their own keys.

    New to grimoire? Read [Concepts](index.md) first.

## Accepting the invitation

The invitation comes by mail, or from the admin directly when the instance sends no mail. Its
link opens a form with your email address filled in; that address is your login. The password
needs at least 12 characters. Creating the account logs you in and opens **My API keys**, where
the first key connects an agent; later logins open the start page.

The link works once and for 7 days. A newer invitation to the same address replaces it. Logging
in, changing the password and a forgotten password work as described under
[Logging in](admin.md#logging-in).

`This invitation link is not valid: it was used, replaced by a newer one, withdrawn or is more
than 7 days old.`: ask an admin to send the invitation again.

When the instance offers login through an identity provider, the invitation page shows a button
per provider next to the password: **Log in with GitLab**, for example. Choosing one creates the
account with the invited address, whatever address the provider has, and without a password; you
then log in through that provider.

## Logging in through an identity provider

The login page shows **Log in with …** for each provider the instance offers. A provider logs you
in to the account it is linked to. Your first login through it creates an account only if an admin
allowed the domain of your address there; otherwise you need an invitation. A login that creates
the account opens **My API keys**, unless it started from another page.

Refusals, and what to do:

- `An account with this email address exists already.`: grimoire never joins accounts by their
  address. Link the provider as described below. Linking asks for your password; an account
  created through another provider has none, so set one first (see
  [Setting a first password](#setting-a-first-password)).
- `No account can be created for this address.`: the domain of your address is not allowed
  there, or the provider did not confirm the address. If you have an account already, log in with
  your password and link the provider as described below; an admin cannot invite an address that
  has an account. Otherwise ask an admin for an invitation.
- `The identity provider sent no email address, so no account can be created.`: ask an admin for
  an invitation.
- `Your account at the identity provider may not log in here.`: the instance admits only certain
  accounts of that provider, such as those of one Google Workspace.
- `The login at the identity provider did not complete. Start it again.`: you took longer than
  10 minutes there, or cancelled.
- `Too many logins through the identity provider from your network did not complete.`: 30 provider
  logins from your network failed within 15 minutes. Wait a few minutes, or log in with your
  password.

### Linking a provider to your account

Open the menu under your address at the top right and choose **Login and password**. Under
**Identity providers**, enter your password and choose **Link …**, then log in at the provider. From then on that provider logs you in to this account, whatever address it reports.
Linking ends your sessions in other browsers; the one you use stays logged in.
One link per provider; a provider account linked to someone else is refused with
`This account at the identity provider is linked to another account already.`

An account without a password cannot link another provider: set one first.

### Setting a first password

An account created through an identity provider has no password. Under **Login and password** in
the menu under your address, **Send me a link** mails a link to your address; it works once,
within an hour. Where the instance sends no mail, ask an admin for a link instead: it works once, within 24 hours. Setting the password ends
all your sessions, also the one in the browser you use; log in again with the new password.

**Remove …** removes a link and ends your sessions in other browsers; the one you use stays
logged in. The last way to log in stays: without a password, the only link cannot be removed
(`This is your only way to log in: set a password or link another provider first.`).

## What you read

The start page lists every source with its state, to anyone. Logged in, **Try a query** searches
the public and the internal ones. Admins add sources and decide whether each is internal or public; to have a repository
added, ask an admin.

## API keys

**Account** at the top opens **My API keys**; the tab **Login and password** beside it holds your
password and identity providers. A key reads all sources, public and internal, including future
ones, or a selection of them; public sources need no key.

- The key is shown once, in the dialog after **Create key**, together with the `claude mcp add`
  command that already contains it. Closing the dialog with **Done** hides both for good. A lost
  key cannot be recovered: revoke it and create a new one.
- **Only these:** finds sources by name or slug as you type; with many sources it lists the first 8
  matches, so narrow the search until the one you want appears.
- **Edit** edits sources and expiry without replacing the key; the name stays.
- **Valid until** is optional. The key works through that day in the instance's time zone.
- Each key shows its requests per day for the last 90 days. Counts can lag a minute behind and
  lose that minute when the server restarts.
- Admins see every key with its owner, sources, expiry, last use and requests, and may revoke it.

Connecting an agent with the key: [Connecting agents](agents.md).

## When your account is deleted

An admin deletes accounts under **Users**. Your API keys stop working at once and your sessions
end.

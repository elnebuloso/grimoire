# Your account and API keys

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

When the instance offers login through an identity provider, the invitation page shows a button
per provider next to the password: **Log in with GitLab**, for example. Choosing one creates the
account with the invited address, whatever address the provider has, and without a password; you
then log in through that provider.

## Logging in through an identity provider

The login page shows **Log in with …** for each provider the instance offers. A provider logs you
in to the account it is linked to. Your first login through it creates an account only if an admin
allowed the domain of your address there; otherwise you need an invitation.

Refusals, and what to do:

- `An account with this email address exists already.`: grimoire never joins accounts by their
  address. Link the provider as described below. Linking asks for your password; an account
  created through another provider has none, so set one first through **Forgot your password?**
  on the login page.
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

Your address in the header opens **Account**. Under **Identity providers**, enter your password
and choose **Link …**, then log in at the provider. From then on that provider logs you in to this account, whatever address it reports.
One link per provider; a provider account linked to someone else is refused with
`This account at the identity provider is linked to another account already.`

An account without a password cannot link another provider: set a password first with **Forgot
your password?** on the login page, if the instance offers it.

**Remove …** removes a link and ends your sessions in other browsers; the one you use stays
logged in. The last way to log in stays: without a password, the only link cannot be removed
(`This is your only way to log in: set a password or link another provider first.`).

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

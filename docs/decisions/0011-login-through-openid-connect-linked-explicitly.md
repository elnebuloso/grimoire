# 0011 – Log in through OpenID Connect providers, linked explicitly

| | |
|---|---|
| Status | Proposed |
| Date | 2026-11-05 |
| Deciders | Projectowner |
| Covers | How users log in through external identity providers, how such a login finds its account, when it creates one, and what grimoire keeps from the provider |

## Context

Organisations running an instance already manage their people in an identity provider such as
Microsoft Entra, Google Workspace or GitLab. Their users want to log in with that account instead
of keeping another password, and operators want accounts to follow the people they already
manage.

An external login can take over an account it was never meant for. A provider asserts an email
address, and some providers let their users or tenant administrators choose any address; whoever
links accounts by that address hands an existing account to whoever can make a provider claim it.
Several identity providers, each with its own idea of a verified address, multiply the risk.

## Decision

- **Any number of OpenID Connect providers, configured by the operator.** One generic
  implementation of the authorization code flow with PKCE serves every provider; a provider is
  configuration, not code. Logins are offered only for configured providers.
- **An external identity is the provider's issuer and subject**, never the email address. A user
  links at most one identity per provider; an identity belongs to at most one user.
- **An existing account is never linked by its email address.** Its owner links a provider while
  logged in, after entering the current password. A login through a provider whose email belongs
  to an account without that link is refused, with the hint to link it this way.
- **A provider login creates an account only**
  - through an invitation link, which proves the invitation and keeps the invited address, or
  - when the provider marks the address as verified and its domain is one the operator allows for
    that provider. Without an allowed domain nobody signs up; the operator may allow every domain.
- **The operator may require claims per provider**, such as the Google Workspace domain or the
  Entra tenant. They are checked on every login, not only when an account is created.
- **Nothing of the provider's tokens is kept.** The ID token is validated and discarded; grimoire
  runs its own session and asks the provider for nothing later, so there are no refresh tokens.
  Only the identity and the email address are read.
- **Roles stay local.** An account a provider login creates has no role: it reads what every user
  reads and creates its own API keys. Groups of the provider grant nothing; administrators assign
  roles as before, and what each role may do does not change.
- **An account may have no password.** Accounts created through a provider log in only through it
  until their owner sets a password by the usual password reset.
- **Unlinking leaves a way in.** A user unlinks a provider only while a password or another
  configured provider remains; an administrator can remove a link. Removing one ends the user's
  other sessions.

## Consequences

- People log in with the account their organisation already manages, without an extra password.
- No address asserted by a provider ever grants access to an existing account, and every link was
  made by someone who proved to own both sides.
- A user blocked at the provider keeps an open session until it ends, and keeps their API keys;
  leaving people have to be removed in grimoire too.
- A deleted user whose domain is allowed can sign up again with the same provider account. Keeping
  someone out for good is done at the provider or by narrowing the allowed domains.
- When the operator changes a provider's issuer or registers the application anew, existing links
  stop matching; users fall back to their password or a reset, and link again.
- The address of an account does not follow a change at the provider.

## Rejected alternatives

**Link an existing account automatically when the email matches.** The convenient choice, and an
opt-in in several comparable tools. It is how accounts get taken over: a provider whose users or
tenants set their own address, or a mailbox registered at a provider before its owner arrives,
gives an attacker someone else's account. Linking by the owner while logged in is one extra step
once per user.

**Use an authentication framework for the whole login.** Such frameworks bring their own sessions,
tables and migration tooling; the existing sessions, roles and attempt limits would be replaced or
run twice. Only the protocol part is taken from a library.

**Keep the provider's refresh token to notice blocked users.** Every request would depend on the
provider, and the session would end whenever the provider's token does. A bounded own session
gives the same limit without the dependency.

**A single provider per instance, accounts by invitation only.** Smallest, but organisations using
several providers could offer only one, and every person would need an invitation even where the
organisation's domain already identifies them.

**Ask for a fresh provider login before linking or creating keys.** Providers differ in whether
and how they report the time of the login, and no comparable tool does this; the current password
protects linking, and keys are visible to and revocable by their owner.

**Remember deleted identities to keep them out.** A second list administrators would have to know
about, for a case the provider and the allowed domains already handle.

## Revision

Reopen when roles or read access should follow the provider's groups, or when a blocked user at
the provider must lose access before their session ends.

# 0006 – One instance key, with a derived key per purpose

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-31 |
| Deciders | Projectowner |
| Covers | Which key encrypts the secrets grimoire stores, and how one key serves several kinds of secret |

## Context

grimoire stores secrets it has to use again itself, so they are encrypted rather than hashed: the
access token of each source, which every sync sends to the Git host. As settings of the instance
move into the database, more secrets of that kind follow, such as the password of a mail server or
the client secret of an identity provider.

The database file is copied into backups and may be read by whoever can reach the volume. Without
the key, it must not reveal any of these secrets. The key itself comes from the operator, with the
deployment, and never lies in the database.

## Decision

- **One key per instance**, set by the operator in the deployment configuration. It protects every
  secret grimoire stores, whatever its kind.
- **One key per purpose, derived from it with HKDF** and a fixed label naming the purpose. The
  derived keys are computed on start and never stored; a new purpose gets a label of its own, and
  a label is never reused for another purpose.
- **Each secret is encrypted with AES-256-GCM** under the key of its purpose.
- **Exports do not use this key.** An export that carries secrets is encrypted with a passphrase
  chosen when it is made.

## Consequences

- The operator keeps one key, whatever grimoire stores. Losing it, or starting with another one,
  makes every stored secret unreadable until it is entered again; the rest of the data is
  unaffected.
- A value encrypted for one purpose never decrypts under another, even though one key lies behind
  both.
- A new kind of secret needs a label and no change to the deployment.
- Changing the key is not supported beyond entering every secret again.
- An export can be read on any instance by whoever has its passphrase, and the instances need not
  share a key.

## Rejected alternatives

**The instance key directly for every purpose.** The obvious one: nothing to derive, and with a
single purpose it is what grimoire did. But the same key material would then encrypt secrets of
different kinds, and a value taken from one place could pass as valid in another. Deriving costs
one computation per purpose on start.

**A key of its own per purpose in the deployment configuration.** The same separation without a
derivation, but the operator would have to generate, store and back up a new key whenever grimoire
learns to keep a new kind of secret, and a missing key would surface only when that secret is first
used.

**Encrypting exports with the instance key.** An export could then only be read where the same key
is set: moving settings from one instance to another would require every instance to share one
key, so one leak would open them all. A backup of the same instance does not need an export; it is
a copy of the database file.

## Revision

Reopen when the key has to be changed without entering every secret again, or when secrets have to
be kept in a secret manager the organisation already runs.

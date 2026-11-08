# 0009 – Export and import of an instance

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-05 |
| Deciders | Projectowner |
| Covers | What an export of an instance carries, how it is protected, which versions read it, and where it can be imported |

## Context

A backup is a consistent copy of the database file (ADR 0001). It restores the same instance, or a
new one started with the same instance key: the stored secrets decrypt only under the key that
encrypted them (ADR 0006). Moving the state to an instance with its own key, or giving an instance
a new key, has no path; every secret would have to be entered again.

Only part of the data needs to move. Sources, users, API keys and settings exist nowhere else.
Pages, snippets, links and the search index are rebuilt from Git by the next sync, and sessions,
pending invitations, sync history and missed queries describe the running instance rather than its
content.

Whoever moves an instance may have a browser and no shell on the target, which until its first
administrator exists offers nothing but the setup.

## Decision

- **An export is the real state of the whole instance, in one file.** Sources with their access
  tokens and visibility, users with their roles and password hashes, API keys with their
  owners and the sources they reach, and the settings. Derived and transient data stay behind.
- **An administrator exports**, from the management area.
- **The whole file is encrypted with a key derived from a passphrase**, chosen when the export is
  made and entered twice: scrypt for the derivation, AES-256-GCM for the content. Only a header
  naming the format, its version and the derivation parameters stays readable.
- **Stored secrets travel decrypted inside the encrypted file.** On export they are decrypted
  under the instance key; on import they are encrypted under the key of the target. It does not
  matter whether the target runs with the same key or another one. A secret that does not decrypt
  on export stops the export and names where it belongs, so it is fixed where it can be.
- **The content is a database at its schema version.** An import runs the same forward migrations
  an update runs, so a version reads the exports of every earlier version from the first one that
  exports on. An export of a newer version is refused, as a database of a newer version is.
- **Imports go into an empty instance only**, one without users and without sources: by a command
  in the container, or on the setup page, behind the same one-time setup token that guards the
  creation of the first administrator. The imported administrators log in with their accounts.
- **The import names the sources the target will not reach.** A Git host the source instance
  allowed may be refused by the rules of the target; the import says which sources are affected
  instead of leaving it to their first failed sync.

## Consequences

- An instance moves to another host, cluster or key with one file and one passphrase; the targets
  need not share a key, and no instance key ever leaves its deployment.
- The instance key can be changed: export, start an empty instance with the new key, import.
  Sessions, sync history and missed queries are lost on the way; pages come back with the first
  sync of each source.
- Whoever holds the file and its passphrase holds every access token in it. The file is a secret
  until it is deleted, and a weak passphrase is the weak point: the derivation slows guessing, it
  does not prevent it.
- A lost passphrase makes the export worthless; nothing can recover it.
- Every user logs in again after an import.
- Each new kind of real state has to be added to the export when it is introduced, or it is left
  behind silently. Derived data needs nothing.
- An export of the first version that exports must stay importable, which an import test of such a
  file keeps true.

## Rejected alternatives

**Carry the secrets as they are stored, encrypted under the instance key.** The cheapest: the file
is copied out and in unchanged, and nothing is decrypted on the way. But it only works when the
target has the same key, and that case already has a path – the backup copy of the database file.
It would also leave the instance key as the only way to change it: entering every secret again.

**Leave the secrets out.** No access token ever leaves the instance. Every one would have to be
entered again on the target, and each source fails to sync until then; that is the cost this
decision exists to remove. Making it a choice at export time doubles what each export can be,
for a case nobody has asked for.

**A format of its own, such as JSON**, independent of the database schema. Readable without
grimoire and stable on its own. But every schema change would need a second conversion for the
export format and a converter for every earlier format version, maintained next to the migrations
that already carry the database forward.

**Merge an import into an instance that has data.** It would join instances. Slugs, email
addresses and owners collide, and every collision needs a rule of its own – a decision of its own
the day someone needs it.

**An export per user, of their own sources and keys.** Narrower files and no administrator needed.
But users and their roles are the instance's, not the user's, and an import into an empty instance
would then lack its administrators. Nobody has asked for it.

**Import only by a command in the container.** Enough for operators with a shell; not for those
who run the image on a platform that offers none, before any administrator can log in.

## Revision

Reopen when instances with data have to take in an export, when exports have to be readable by
something other than grimoire, or when a secret must not leave the instance even encrypted.

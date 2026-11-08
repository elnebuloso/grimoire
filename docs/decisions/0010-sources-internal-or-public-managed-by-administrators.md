# 0010 – Sources are internal or public, managed by administrators

| | |
|---|---|
| Status | Superseded |
| Date | 2026-11-05 |
| Deciders | Projectowner |
| Covers | Who may read a source, who adds, changes and deletes one, and what the message about a duplicate source reveals |
| Superseded by | 0012, 0013, 0014 |

## Context

ADR 0007 let every user add sources, gave each source an owner and a third visibility level,
*private*, readable only with the owner's keys. An instance serves the documentation an
organisation chooses to offer: some of it to everyone, some to its own people. Private sources
turn that into a question of who holds which source, and every list, search and message has to
answer it per user. That is the start of a permission system, and the instance is not meant to
replace the one the organisation already has for its repositories.

## Decision

- **A source is internal or public**, internal when created, and can be switched either way at
  any time:
  - *public* – read and searched by anyone, without logging in and without an API key;
  - *internal* – read with the API key of any user, and shown in the interface to anyone logged in.
- **Sources have no owner.** Only administrators add, change, sync and delete sources; the
  management area is theirs alone.
- **A key reads public and internal sources**, all of them or a selection. Keys stay with their
  user as ADR 0007 decided: every user creates and manages their own, administrators see and may
  revoke any.
- **A private source becomes internal on upgrade**, so no documentation disappears.
- **The message about a duplicate names the existing source.** Only administrators add sources,
  and they see every one.

This supersedes ADR 0007 for sources: their owner, their visibility and who manages them. It
supersedes ADR 0008 for what the message about a duplicate reveals.

## Consequences

- Who may read a source is answered by one switch with two positions, the same for every user.
- A user's account gives access to internal documentation and the keys to read it with, nothing
  more. Who wants a repository added asks an administrator.
- Deleting a user revokes their keys and ends their sessions; no documentation changes hands.
- An upgrade opens what was private to every user's keys. The release says so before anyone
  upgrades.

## Rejected alternatives

**Keep private sources.** Costs nothing for whoever already relies on them. But every reading
path has to know the user behind a key, an administrator's key must be kept from other users'
drafts, and a duplicate message must hide what it found. Drafts belong in the repository until
they are ready to be read.

**Keep owners and let users manage their own sources.** Removes the administrator as a bottleneck
for new repositories. But without private sources, what a user adds is read by everyone at once,
and an owner who may change it next to administrators who may as well adds a second rule for no
reader's benefit.

**Grant rights per source to users or groups.** Covers every case, but it is the permission
system the organisation already runs for its repositories, rebuilt and maintained a second time.

## Revision

Reopen when documentation has to be readable by some users and not others.

# 0012 – Sources are internal or public, managed by administrators

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-08 |
| Deciders | Projectowner |
| Covers | What a source is, who may read it with and without an API key, what the start page shows, and who adds, changes and deletes a source |
| Supersedes | 0004, 0007, 0010 |

## Context

Agents and visitors read the documentation of sources: a path in a Git repository. An instance
serves the documentation an organisation chooses to offer: some of it to everyone, some to its own
people. Several documentation paths in one repository are rare, and agents search across all
documentation unless they ask for less.

The organisation already has a permission system for its repositories; the instance is not meant
to replace it. A question of who holds which source, answered per user in every list, search and
message, would be the start of a second one.

This ADR restates what is still in force from ADR 0004 and ADR 0010 and the source part of ADR
0007, in one place. One point changes in the consolidation: the start page shows every source to
anyone, as ADR 0004 had it, rather than internal sources to logged-in users only, as ADR 0010 had
it — so whoever opens the instance sees how much documentation it holds.

## Decision

- **Sources are the only unit; nothing groups them.** A source has a name for people and a slug,
  unique across the instance, that agents see in the ID of every page and snippet. Two
  documentation paths in one repository are two sources, each named for what it holds.
- **A source is internal or public**, internal when created, and can be switched either way at any
  time:
  - *public* – read and searched by anyone, without logging in and without an API key;
  - *internal* – read with the API key of any user, and in the interface by anyone logged in.
- **An API key reads public and internal sources**, all of them or a selection; it never hides a
  public source. What keys are and who holds them is ADR 0013.
- **The start page lists every source to anyone**, with its name, description, visibility and
  stats, so the scope of the instance is visible before logging in. Links to the published
  documentation and what visitors may try without logging in exist only for public sources; the
  content of an internal source is read only as above.
- **Sources have no owner.** Only administrators add, change, sync and delete sources.
- **A private source of an earlier version becomes internal on upgrade**, so no documentation
  disappears.

## Consequences

- Who may read a source is answered by one switch with two positions, the same for every user, and
  a key scope is a plain list of sources.
- An agent narrows a search by naming sources. Who wants the documentation of one product searched
  together names its sources, or searches everything.
- The names, descriptions and stats of internal sources are visible to anyone who opens the start
  page; their content and addresses are not.
- A user's account gives access to internal documentation and the keys to read it with, nothing
  more. Who wants a repository added asks an administrator.
- Making a source public cannot be taken back from whoever read it in the meantime, which is why a
  new source starts internal.
- The upgrade that removed private sources opened them to every user's keys; the release said so.

## Rejected alternatives

**Private sources, readable only with their owner's keys.** Decided once (ADR 0007) and taken back:
every reading path has to know the user behind a key, an administrator's key must be kept from
other users' drafts, and a duplicate message must hide what it found. Drafts belong in the
repository until they are ready to be read.

**Owners who manage their own sources.** Removes the administrator as a bottleneck for new
repositories. But without private sources, what a user adds is read by everyone at once, and an
owner who may change it next to administrators who may as well adds a second rule for no reader's
benefit.

**Projects that group several sources.** Several repositories often describe one product, and a
project lets an agent search exactly those with one request. But agents search everything unless
they ask for less, and naming the sources narrows a search just as well. A project is a level that
has to exist before the first source, appears in every ID and every key scope, and would be a
second place to set visibility where the two can contradict each other.

**Rights per source for users or groups.** Covers every case, but it is the permission system the
organisation already runs for its repositories, rebuilt and maintained a second time.

**Internal sources listed only to logged-in users.** Hides that internal documentation exists. But
users are to see how much documentation the instance holds before they log in, and names and stats
reveal no content.

**Public by default.** Sources usually hold internal documentation; one forgotten switch would
publish it, and that cannot be undone.

## Revision

Reopen when documentation has to be readable by some users and not others, when the existence of a
source must itself stay hidden from visitors, or when agents keep naming the same set of sources
often enough that the set wants a name.

# 0003 – Access: users with roles, public and private sources

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-30 |
| Deciders | Projectowner |
| Covers | How accounts, their roles and their sessions decide access to the admin area; how documentation is organised into sources and who may read each one, with and without an API key |

## Context

grimoire started with exactly one local admin account. Further users are to manage data in the app
later, and a user can hold several roles. Adding users and assigning roles in the UI comes later;
the data model has to carry it from now on, so that feature adds users without changing how
accounts, sessions and access work.

Agents and visitors read the documentation of sources: a path in a Git repository. Some of it may
be read by anyone who can reach the instance, some only by agents holding an API key. Several
documentation paths in one repository are rare, and agents search across all documentation unless
they ask for less.

## Decision

### The admin area

- **Accounts are users**, any number of them, each with a unique email address they log in with
  and their own password hash. The first one is created by the setup on first start.
- **A user has any number of roles**, stored as one row per user and role. The roles that exist
  are defined in the code; the schema accepts only those, so a new role is a new migration. Today
  there is one: `admin`, which manages everything in the admin area.
- **Every session belongs to one user.** Logging out and changing the password affect only that
  user's sessions.
- **Access is decided per request** from the user of the session and their roles. The admin area
  needs the role `admin`; login and logout stay open to every user.
- **The setup stays reachable while no user has the role `admin`**, whatever other users exist;
  it is how a lost last admin is replaced.

### Reading documentation

- **Sources are the only unit; nothing groups them.** A source has a name for people and a slug,
  unique across the instance, that agents use in IDs: `source/page#anchor`. Two documentation
  paths in one repository are two sources, each named for what it holds.
- **Every source is public or private**, private when created.
- **Without an API key**, a request reads and searches the public sources.
- **An API key adds sources** — all of them or a selection — to the public ones; it never hides a
  public source.
- **The start page lists every source** with its visibility and stats. Links to the published
  documentation and what visitors may try without logging in exist only for public sources.

## Consequences

- What a role allows is code, reviewed and tested like any other code; there is no place where
  permissions are configured at runtime.
- A new role costs a migration and a code change, which is also where its permissions are written.
- Removing the last admin, for example with `scripts/reset-admin.ts`, reopens the setup even when
  other users remain.
- An agent narrows a search by naming sources. Who wants the documentation of one product searched
  together names its sources, or searches everything.
- Visibility is answered in one place per source, and a key scope is a plain list of sources.
- The names and stats of private sources are visible to anyone who opens the start page; their
  content and addresses are not.
- Making a source public cannot be taken back from whoever read it in the meantime, which is why a
  new source starts private.

## Rejected alternatives

**Projects that group several sources.** The obvious objection: several repositories often
describe one product, and a project lets an agent search exactly those with one request. But
agents search everything unless they ask for less, and naming the sources narrows a search just as
well. A project is a level that has to exist before the first source, appears in every ID and
every key scope, and once visibility is per source it is a second place to set it — public project,
private source — where the two can contradict each other.

**Visibility per project, or per project with an override per source.** Coarser than the content
it protects: one private path in a public group makes the whole group private or needs the
override, and the override is the per-source switch with an extra rule on top.

**Public by default.** Sources usually hold internal documentation; one forgotten switch would
publish it, and that cannot be undone.

**Roles and their permissions as data, edited in the admin area.** The obvious one for a user
system: admins define roles and tick permissions. Rejected because nobody needs to define roles
yet, and a permission only means something where code checks it; configurable permissions would be
a second description of what the code already decides, and one that can contradict it.

**One role column on the user.** Simpler, but a user can hold several roles, and combined roles
such as `admin-and-editor` multiply with every role added.

**The roles as a list inside the user row** (text or JSON). One row per user, but the database
cannot check the values, and "is there any admin" becomes a scan through every list instead of one
indexed lookup.

**Random, unguessable IDs to protect accounts and data.** Access depends on who is logged in and
which roles they hold, checked on every request; an ID nobody can guess adds nothing where that
check exists, and hides nothing where it is missing. Keys stay integers.

## Revision

Reopen when roles have to differ per source, when users come from an external identity provider
whose groups should decide the roles, when agents keep naming the same set of sources often enough
that the set wants a name, or when who may read a source has to depend on the user rather than on
the API key.

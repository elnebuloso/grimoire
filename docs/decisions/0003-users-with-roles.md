# 0003 – Users with roles

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-30 |
| Deciders | Projectowner |
| Covers | How accounts, their roles and their sessions decide access to the management area |

## Context

An instance is managed by several people, and one person may hold several roles. The data model
has to carry that from the first account on, so that adding users and assigning roles in the UI
does not change how accounts, sessions and access work.

## Decision

- **Accounts are users**, any number of them, each with a unique email address they log in with
  and their own password hash. The first one is created by the setup on first start.
- **A user has any number of roles**, stored as one row per user and role. The roles that exist
  are defined in the code; the schema accepts only those, so a new role is a new migration. The
  first role is `admin`, which manages everything in the management area.
- **Every session belongs to one user.** Logging out and changing the password affect only that
  user's sessions.
- **Access is decided per request** from the user of the session and their roles. The management
  area needs the role `admin`; login and logout stay open to every user.
- **The setup stays reachable while no user has the role `admin`**, whatever other users exist;
  it is how a lost last admin is replaced.

## Consequences

- What a role allows is code, reviewed and tested like any other code; there is no place where
  permissions are configured at runtime.
- A new role costs a migration and a code change, which is also where its permissions are written.
- Removing the last admin, as resetting a lost admin account does, reopens the setup even when
  other users remain.

## Rejected alternatives

**Roles and their permissions as data, edited in the management area.** The obvious one for a user
system: admins define roles and tick permissions. Rejected because a permission only means
something where code checks it; configurable permissions would be a second description of what the
code already decides, and one that can contradict it.

**One role column on the user.** Simpler, but a user can hold several roles, and combined roles
such as `admin-and-editor` multiply with every role added.

**The roles as a list inside the user row** (text or JSON). One row per user, but the database
cannot check the values, and "is there any admin" becomes a scan through every list instead of one
indexed lookup.

**Random, unguessable IDs to protect accounts and data.** Access depends on who is logged in and
which roles they hold, checked on every request; an ID nobody can guess adds nothing where that
check exists, and hides nothing where it is missing. Keys stay integers.

## Revision

Reopen when roles have to differ per source, or when users come from an external identity provider
whose groups should decide the roles.

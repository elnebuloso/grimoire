# 0015 – Users with roles

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-08 |
| Deciders | Projectowner |
| Covers | How accounts, their roles and their sessions decide access to the management area, how a check for several roles is met, and how an instance keeps an administrator |
| Supersedes | 0003, 0007 |

## Context

An instance is managed by several people, and one person may hold several roles. The data model
has to carry that from the first account on, so that adding users and assigning roles in the UI
does not change how accounts, sessions and access work.

This ADR restates ADR 0003 together with the role rules of ADR 0007, which had stayed a proposal
while the code already followed them; the consolidation accepts them. One point changes: ADR 0003
replaced a lost last administrator by removing them, which reopened the setup. Since the last
administrator can no longer be removed, a command in the container grants the role instead.

## Decision

- **Accounts are users**, any number of them, each with a unique email address and their own
  login. The first one is created by the setup on first start.
- **A user has any number of roles**, stored as one row per user and role. The roles that exist are
  defined in the code; the schema accepts only those, so a new role is a new migration. The only
  role so far is the administrator, who manages everything in the management area; a user without
  a role reads documentation and manages their own API keys (ADR 0013).
- **A check for roles is met only when the user holds every role it names.**
- **Every session belongs to one user.** Logging out and changing the password affect only that
  user's sessions; deleting a user ends them.
- **Access is decided per request** from the user of the session and their roles. The management
  area needs the administrator role; login and logout stay open to every user.
- **The last administrator stays.** They cannot be deleted or lose the role.
- **The setup creates the first administrator** and stays reachable while no user has the
  administrator role, whatever other users exist.
- **A lost administrator is replaced by a command in the container** that grants the role to an
  existing account, and can set its password. It deletes nothing.

## Consequences

- What a role allows is code, reviewed and tested like any other code; there is no place where
  permissions are configured at runtime.
- A new role costs a migration and a code change, which is also where its permissions are written.
- An instance always has an administrator once the setup is done; nobody locks it out of its own
  management area through the interface.
- Whoever has lost every administrator login needs a shell in the container, or the operator, to
  get back in.

## Rejected alternatives

**Roles and their permissions as data, edited in the management area.** The obvious one for a user
system: admins define roles and tick permissions. Rejected because a permission only means
something where code checks it; configurable permissions would be a second description of what the
code already decides, and one that can contradict it.

**One role column on the user.** Simpler, but a user can hold several roles, and combined roles
such as administrator-and-editor multiply with every role added.

**The roles as a list inside the user row** (text or JSON). One row per user, but the database
cannot check the values, and "is there any admin" becomes a scan through every list instead of one
indexed lookup.

**Random, unguessable IDs to protect accounts and data.** Access depends on who is logged in and
which roles they hold, checked on every request; an ID nobody can guess adds nothing where that
check exists, and hides nothing where it is missing. Keys stay integers.

## Revision

Reopen when roles have to differ per source, or when the groups of an identity provider should
decide the roles.

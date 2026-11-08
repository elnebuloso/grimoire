# 0013 – Every user owns their API keys

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-08 |
| Deciders | Projectowner |
| Covers | Who creates, sees and revokes an API key, what a key reads, and what happens to keys when their user is deleted |
| Supersedes | 0007, 0010 |

## Context

An instance is the central documentation of an organisation, and many people connect their own
tools to it. When every API key belonged to the instance and was created by an administrator on
request, the administrator was the bottleneck for every new tool, and no key could be traced to
whoever used it.

This ADR restates the key part of ADR 0007 and of ADR 0010. ADR 0007 had stayed a proposal while
the code and later ADRs already relied on it; the consolidation accepts it.

## Decision

- **Every API key has an owner**, the user who created it. Keys that existed before owners did
  belong to the first administrator.
- **Every user creates and manages their own keys**, whatever their roles.
- **A key reads what ADR 0012 lets keys read**: public and internal sources, all of them or a
  selection. Its owner's roles add nothing to it.
- **Administrators see every key**, with its owner and its use, **and may revoke any of them.**
- **Deleting a user revokes their keys.**

## Consequences

- Nobody waits for an administrator to connect a tool.
- A key in heavy use, or one forgotten, can be traced to a person and asked about or revoked.
- Whoever leaves takes no access with them: their keys go with their account.
- An administrator's key reads no more than anyone else's.

## Rejected alternatives

**Keys owned by the instance, issued by administrators.** The state before this decision: one
person serves every request for a key, and a key cannot be traced to whoever uses it.

**Keys of administrators read more than other keys.** How some code hosting tools behave. But
managing happens in the interface, where the administrator sees everything anyway; a key is a
long-lived secret kept in tool configurations and build variables, leaked more easily than a
session, and a key that opens more would be the most valuable secret on the instance.

## Revision

Reopen when keys have to belong to a team or a service rather than a person, or when what a key
reads has to differ per user.

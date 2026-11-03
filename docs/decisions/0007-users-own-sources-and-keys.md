# 0007 – Users own sources and keys; sources are private, internal or public

| | |
|---|---|
| Status | Proposed |
| Date | 2026-11-03 |
| Deciders | Projectowner |
| Covers | Who owns a source and an API key, who may read, list, change and delete a source, and what happens to both when their owner leaves |

## Context

An instance is the central documentation of an organisation: many people add sources and connect
their own tools. Until now only administrators managed sources, and every API key was the
instance's, created by an administrator on request. That makes the administrator the bottleneck for
every new tool and every new repository, and leaves no way to tell whose key or whose source
something is.

Once anyone with an account adds sources, "private" can no longer mean "readable with any key":
a person's own drafts would be open to every colleague's tools.

## Decision

- **Every account is a user; administrator is a role on top.** Only the administrator role is
  stored. A check for roles is met only when the user holds every role it names.
- **Every source and every API key has an owner**, the user who created it. What existed before
  owners did belongs to the first administrator.
- **A source is private, internal or public**, private when created:
  - *private* – read only with keys of its owner;
  - *internal* – read with the key of any user;
  - *public* – read by anyone, without a key.
- **A key reads within what its owner may read**: public and internal sources and the owner's
  private ones, all of them or a selection.
- **Keys of an administrator follow the same rule.** They do not read other users' private sources.
- **Lists show what the viewer may read.** A visitor sees public sources, a logged-in user also
  internal ones and their own private ones. In the management area administrators see every source,
  with its settings, sync state and pages, because they manage it.
- **A source is changed and deleted by its owner or an administrator.** Settings of the instance and
  the users are managed by administrators only.
- **Every user creates and manages their own keys.** Administrators see every key with its owner
  and use, and may revoke any of them; only its owner edits one.
- **When a user is deleted**, their sources pass to the administrator who deletes them, their keys
  are revoked, their sessions end. The last administrator cannot be deleted or lose the role.

## Consequences

- Nobody waits for an administrator to connect a tool or add a repository.
- The visibility of a source answers who reads it in one place; a key adds nothing beyond its
  owner's reach.
- Whoever leaves takes no access with them and leaves no documentation without an owner.
- An administrator can still read any source: by managing it in the interface or by making it
  internal. The rule keeps a private source from being opened by accident, not from an
  administrator.

## Rejected alternatives

**Keys of administrators read every source.** The obvious choice, and how some code hosting tools
behave. But managing a source happens in the interface, where the administrator sees it anyway; a
key is a long-lived secret kept in tool configurations and build variables, leaked more easily than
a session. A key that opens everything would be the most valuable secret on the instance, and an
administrator's tool searching all sources would mix other people's drafts into every answer.

**Keep two levels and let private mean "any key".** Nothing changes for existing keys, but with
many users nobody could keep a source to themselves.

**Keys owned by the instance, issued by administrators.** The state before this decision: one
person serves every request for a key, and a key cannot be traced to whoever uses it.

**Delete a user's sources with the user.** Simplest, but documentation others rely on disappears
with one click and cannot be restored.

**Grant rights per source to named users or groups.** Covers every case, but every source then
carries a list someone has to maintain; the three levels cover what an instance used by one
organisation needs.

## Revision

Reopen when a source has to be shared with some users but not all, or when users come from an
external identity provider whose groups should decide what they read.

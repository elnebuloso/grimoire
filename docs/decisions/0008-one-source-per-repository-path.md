# 0008 – One source per repository path

| | |
|---|---|
| Status | Superseded |
| Date | 2026-11-05 |
| Deciders | Projectowner |
| Covers | When two sources count as the same documentation, what happens when someone adds or changes a source that duplicates or overlaps another, what the message reveals, and how existing duplicates are found |
| Superseded by | 0014 |

## Context

Since every user adds sources (ADR 0007), the same documentation gets registered twice: by two
people who do not know of each other, or by one person a second time under another name. Every page
of it is then indexed twice. An agent's search returns the same section twice within its token
budget and pushes other results out, and the two copies drift apart as their syncs and settings
differ.

The same Git address can be written in several ways that lead to one repository: with or without a
trailing `.git` or slash, with the host in another case, with the default port. A directory can be
written as `docs`, `docs/` or `./docs`. A comparison of the text as typed misses all of these.

Instances already running may hold duplicates, created before any check existed.

## Decision

- **A source is identified by its repository and its path, not its branch.** Two sources on the
  same repository and the same path are duplicates, whichever branches they follow.
- **Addresses and paths are compared normalised**: the host and the repository path without regard
  to case, without the default port, a trailing `.git` or trailing slashes; a path without leading
  `./` or trailing slashes, an empty path and `.` both meaning the whole repository.
- **A duplicate is refused.** Adding a source that duplicates another, or changing the address
  or path of one so that it does, fails with a message.
- **An overlap is a warning.** When one path lies inside the other in the same repository, the
  pages of the inner one would be indexed twice; saving needs an explicit confirmation, because a
  part of a repository with a visibility or owner of its own is a legitimate case. A directory the
  outer source excludes does not overlap it.
- **Every source counts; the message names only what the reader may see.** It names the other
  source when the user reads it, or is an administrator, who sees every source in the management
  area anyway. For a private source of another user it says only that the documentation is
  registered already.
- **The check holds at the moment of writing.** Asking the Git server takes seconds; the check runs
  again right before the source is written, so two saves at the same time cannot both pass it.
- **Existing duplicates stay editable.** A change that leaves address and path as they are
  is saved; only a change that creates a duplicate is refused.
- **Administrators see a list of all duplicates and overlaps** in the management area, judged by
  the same rule as a new source, to clean up what existed before.
- **The rule guards the form people use.** Scripts and seeded data write sources directly and are
  not checked.

## Consequences

- An agent finds each page once, and a team finds the source that already exists instead of adding
  a second one.
- Several versions of the same documentation cannot be registered as separate sources from
  separate branches. A source follows one branch; who needs another version changes that branch.
- Whoever tries to register documentation a colleague holds privately learns that it exists, not
  where. They have to ask around, or an administrator, who sees it in the list.
- A fork, a mirror on another host or a copied directory is not recognised: the addresses differ.

## Rejected alternatives

**A uniqueness constraint in the database.** The obvious place for a rule that must always hold,
enforced on every write however it happens. But it fails on the duplicates instances already hold,
and it cannot see an overlap of paths or two spellings of one address.

**Count a different branch as a different source.** It would allow one source per version of the
documentation, from a branch per release. But an agent asking a question then gets the same section
in every version, mostly identical, within one budget; and the case nobody asked for would be paid
for by every search. Versions, if they are ever needed, are a property of one source, not a second
source.

**Compare the address and path as typed.** The cheapest check, and the one that misses the common
cases: the address copied from the browser against the one copied from the clone button differs by
a `.git`.

**Name every duplicate, private ones included.** The quickest way to the colleague who holds the
documentation. But a private source is invisible to everyone else, its name included; a duplicate
check must not be the way around that.

**Ask the hosting service for the repository's identity.** A moved or renamed repository would be
recognised. But a source is any Git repository reachable over HTTPS; the check would need an API
and its credentials for each hosting service, and still not recognise a fork.

**Compare the content after the sync.** Recognises forks, mirrors and copies, which no address
comparison does. But it judges only after the second copy has been indexed, so it can warn, not
prevent, and it costs a full sync of the copy first.

## Revision

Reopen when versions of one documentation have to be served side by side, or when forks and
mirrors registered as separate sources become a common complaint.

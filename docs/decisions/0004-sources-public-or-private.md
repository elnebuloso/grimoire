# 0004 – Sources as the only unit, public or private

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-30 |
| Deciders | Projectowner |
| Covers | How documentation is organised into sources and who may read each one, with and without an API key |

## Context

Agents and visitors read the documentation of sources: a path in a Git repository. Some of it may
be read by anyone who can reach the instance, some only by agents holding an API key. Several
documentation paths in one repository are rare, and agents search across all documentation unless
they ask for less.

## Decision

- **Sources are the only unit; nothing groups them.** A source has a name for people and a slug,
  unique across the instance, that agents see in the ID of every page and snippet. Two
  documentation paths in one repository are two sources, each named for what it holds.
- **Every source is public or private**, private when created.
- **Without an API key**, a request reads and searches the public sources.
- **An API key adds sources** — all of them or a selection — to the public ones; it never hides a
  public source.
- **The start page lists every source** with its visibility and stats. Links to the published
  documentation and what visitors may try without logging in exist only for public sources.

## Consequences

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

## Revision

Reopen when agents keep naming the same set of sources often enough that the set wants a name, or
when who may read a source has to depend on the user rather than on the API key.

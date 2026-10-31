# 0001 – SQLite, single instance, forward-only migrations

| | |
|---|---|
| Status | Accepted |
| Date | 2026-10-28 |
| Deciders | Projectowner |
| Covers | Database engine, how it is accessed, how many instances run, how the schema evolves |

## Context

grimoire holds two kinds of data. Part of it is real state that exists nowhere else: sources with
their Git access tokens, API keys, user accounts with their roles and sessions, the settings of the
instance, and the history of syncs and of queries that found nothing. Everything else — pages,
snippets, links and the search index — is derived from Git and rebuilt from scratch by every sync
of a source.

Search has to rank snippets by how well a query matches each of their fields, a heading counting
more than the text below it.

grimoire ships as one container, run with Docker or on Kubernetes. On Kubernetes its volume is
typically replicated block storage, which keeps the data safe when a node fails and lets the pod
restart on another node.

## Decision

- **SQLite**, one file on the volume, with its built-in full-text search.
- **Accessed through the SQLite module built into Node**, with plain SQL.
- **One instance.** On Kubernetes: one pod, `replicas: 1`, `strategy: Recreate`, a
  `ReadWriteOnce` or `ReadWriteOncePod` volume.
- **Forward-only migrations.** Schema changes are numbered SQL files, applied in order when
  grimoire starts; the database file records the version it is at. Each runs in its own
  transaction under the write lock, so a second process starting at the same time waits and then
  finds nothing left to do. A migration that has been released is never edited; corrections come
  as a new file.

## Consequences

- No zero-downtime updates: `Recreate` stops the old pod before the new one starts. A node failure
  costs the time Kubernetes needs to notice it and reattach the volume elsewhere.
- Backups are a consistent copy of one file. Going back to an older schema means restoring a
  backup; there are no down migrations.
- A migration may drop and recreate the derived data instead of converting it — the next sync
  fills it again. Only the real state must be carried over.
- Moving to another database later means rewriting the queries for that engine, a fresh set of
  migrations, and copying the real state. The search query is the part that needs real work,
  because ranking differs between engines.

## Rejected alternatives

**PostgreSQL, to run several replicas.** The obvious choice for anything on Kubernetes, and the
only one here that allows two pods at once. Rejected: every operator would have to run and back up
a second component for a tool whose load one process handles, and an internal knowledge base that
is back within minutes after a node failure meets its availability need. Its built-in full-text
search also ranks differently, so keeping the ranking would need an extension on top.

**Several replicas sharing the SQLite file on a `ReadWriteMany` volume.** Shared volumes are served
over a network file system. SQLite's file locking is not reliable there, and its write-ahead log
needs shared memory on one host, so concurrent writers can corrupt the file.

**One SQLite file per replica, each syncing from Git itself.** The derived data could be built
independently per pod, but sources, API keys and accounts are shared state edited in the
management area; keeping them consistent across copies brings back the problem a shared database
solves.

**An ORM with a migration generator.** The full-text index and the trigger that keeps it in step
with the snippets have to be written in plain SQL anyway, and applying numbered files in order is a
few lines of code — not worth a dependency and a second way of describing the schema.

**A native SQLite package from npm.** Same SQL, but a native module has to be built or downloaded
for the image's platform; the built-in module needs nothing.

**Down migrations.** Rarely tested and therefore rarely trustworthy. With one file, restoring the
backup taken before the update is simpler and certain.

## Revision

Reopen when updates without downtime or more than one running instance become a requirement, or
when write load during syncs measurably blocks agent requests.

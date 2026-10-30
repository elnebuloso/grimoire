# 0001 – SQLite, single instance, forward-only migrations

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-28 |
| Deciders | Projectowner |
| Covers | Database engine, how it is accessed, how many instances run, how the schema evolves |

## Context

grimoire holds two kinds of data. A small amount is real state that exists nowhere else:
sources with their access tokens, and API keys. Everything else — pages, snippets,
links and the search index — is derived from Git and rebuilt from scratch by every sync of a
source.

Search ranks snippets with BM25 and weights each column differently: title path strong, text
normal, code weak. Internal documentation is full of service names and commands, where this kind
of ranking beats fuzzier approaches.

grimoire ships as one container. The intended operation is Kubernetes with replicated block
storage (Longhorn), which keeps the data safe when a node fails and lets the pod restart on another
node.

## Decision

- **SQLite**, one file on the volume, with FTS5 for search.
- **Accessed through the SQLite module built into Node**, with plain SQL. All SQL lives in the
  database module of the server code; nothing outside it writes queries.
- **One instance.** One pod, `replicas: 1`, `strategy: Recreate`, a `ReadWriteOnce` or
  `ReadWriteOncePod` volume.
- **Forward-only migrations.** Schema changes are numbered SQL files, applied in order and recorded
  in `PRAGMA user_version`. Each runs in its own transaction under an immediate write lock, so a
  second process starting at the same time waits and then finds nothing left to do. An init
  container in the pod runs them before the app starts. A migration that has been released is
  never edited; corrections come as a new file.

## Consequences

- No zero-downtime updates: `Recreate` stops the old pod before the new one starts. A node failure
  costs the time Kubernetes needs to notice it and reattach the volume elsewhere.
- Backups are a consistent copy of one file. Going back to an older schema means restoring a
  backup; there are no down migrations.
- A migration may drop and recreate pages, snippets, links and the search index instead of
  converting them — the next sync fills them again. Only sources and API keys must be
  carried over.
- Moving to another database later means a new database module, a fresh set of migrations for that
  engine, and copying sources and API keys. The search query is the part that needs real
  work, because ranking differs between engines.

## Rejected alternatives

**PostgreSQL, to run several replicas.** The obvious choice for anything on Kubernetes, and the
only one here that allows two pods at once. Rejected for version 1: every operator would have to
run and back up a second component for a tool whose load one process handles; the built-in full-text
search of PostgreSQL does not rank with BM25, so matching today's ranking needs an extension; and an
internal knowledge base that is back within minutes after a node failure meets its availability
need. Keeping all SQL in one module keeps this door open.

**Several replicas sharing the SQLite file on a `ReadWriteMany` volume.** Shared volumes are served
over NFS (Longhorn runs an NFS server per volume for this mode). SQLite's file locking is not
reliable over NFS, and its write-ahead log needs shared memory on one host, so concurrent writers
can corrupt the file.

**One SQLite file per replica, each syncing from Git itself.** The derived index could be built
independently per pod, but sources and API keys are shared state edited in the admin
area; keeping them consistent across copies brings back the problem a shared database solves.

**An ORM with a migration generator.** The FTS5 table and the trigger that keeps it in step with
the snippets have to be written in plain SQL anyway, and applying numbered files in order is a few
lines of code — not worth a dependency and a second way of describing the schema.

**A native SQLite package from npm.** Same SQL, but a native module has to be built or downloaded
for the image's platform; the built-in module needs nothing.

**Down migrations.** Rarely tested and therefore rarely trustworthy. With one file, restoring the
backup taken before the update is simpler and certain.

## Revision

Reopen when updates without downtime or more than one running instance become a requirement, or
when write load during syncs measurably blocks agent requests.

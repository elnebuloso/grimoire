# 0002 – App settings in a single-row table

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-29 |
| Deciders | Projectowner |
| Covers | Where settings an admin changes in the UI for the whole instance are stored, and how a new one is added |

## Context

Some settings apply to the whole instance and are changed by an admin in the management area while
grimoire runs, such as pausing the syncs of all sources. Settings of the deployment — addresses,
keys, limits — stay environment variables, set by whoever operates grimoire.

An instance setting is real state, like sources and API keys: it exists nowhere else and has to
survive a restart. Each comes with a type of its own: a flag, a number, a schedule, a name.

## Decision

- **The settings live in the SQLite database**, in a table with exactly one row; the schema
  enforces that there is never a second one.
- **One typed column per setting**, with its default and, where the type allows more values than
  the setting does, a `CHECK` constraint. A fresh database therefore starts with every default.
- **A new setting is a new migration** adding its column, like any other schema change.

## Consequences

- Reading the settings is one query for one row, whose shape the code knows from the schema.
- A value the code would reject can never be stored, not even by hand in the database file.
- Removing or renaming a setting is a migration too; there are no leftover keys from older versions
  that the code has to ignore.
- Adding a setting costs a migration file even when it is a single flag.

## Rejected alternatives

**A key-value table.** The obvious one: a new setting needs no migration, just a new key. But every
value is text, so type, default and allowed range live only in the code, and a key the code no
longer knows stays in the table unnoticed. Migrations are already the way every schema change is
made here and cost one small file; the database checking each value is worth more than saving that
file.

**One JSON column holding all settings.** No migration per setting either, and one row like the
decision. It shares the drawback of the key-value table: SQLite does not check what is inside, so
defaults and validation move into the code, and every write rewrites the whole document.

**A file or a Kubernetes ConfigMap.** Changing it means editing it outside grimoire, which is the
problem the settings page solves; a ConfigMap is read-only to the pod, and a file on the volume
would be a second store next to the database, with its own backup and its own concurrent writes.

## Revision

Reopen when settings have to be defined at runtime — by plugins or per source — instead of being
known when the code is written.

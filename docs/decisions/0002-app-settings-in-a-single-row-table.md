# 0002 – App settings in a single-row table

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-29 |
| Deciders | Projectowner |
| Covers | Where settings an admin changes in the UI for the whole instance are stored, and how a new one is added |

## Context

Until now everything grimoire does instance-wide is set by environment variables, which an admin
can only change by redeploying. The admin area gets a settings page whose values apply to the whole
instance; the first is a switch that pauses the syncs of all sources. More will follow, each with a
type of its own: a flag, a number, a cron expression, a name.

Such a setting is real state, like projects and sources: it exists nowhere else and has to survive
a restart of the pod.

## Decision

- **The settings live in the SQLite database**, in a table `settings` with exactly one row; the
  schema enforces that there is never a second one.
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

**A key-value table `settings(key, value)`.** The obvious one: a new setting needs no migration,
just a new key. But every value is text, so type, default and allowed range live only in the
code, and a key the code no longer knows stays in the table unnoticed. Migrations are already the
way every schema change is made here and cost one small file; the database checking each value is
worth more than saving that file.

**One JSON column holding all settings.** No migration per setting either, and one row like the
decision. It shares the drawback of the key-value table: SQLite does not check what is inside, so
defaults and validation move into the code, and every write rewrites the whole document.

**A file or a Kubernetes ConfigMap.** Changing it means editing it outside grimoire, which is the
problem the settings page solves; a ConfigMap is read-only to the pod, and a file on the volume
would be a second store next to the database, with its own backup and its own concurrent writes.

## Revision

Reopen when settings have to be defined at runtime — by plugins or per project — instead of being
known when the code is written.

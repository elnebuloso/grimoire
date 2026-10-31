# Until v1

Rules for the phase before `1.0.0`. Each section says when it ends; delete it then, and delete this
file in the commit that cuts `1.0.0`.

## Releases

- **No breaking-change markers.** A `BREAKING CHANGE:` footer cuts `1.0.0`, and leaving `0.x` is
  the user's call, not a side effect of a commit. `!` after the type is out too: the release config
  doesn't parse it and skips the commit, so the change ships without a release. A change that
  breaks something goes in as `feat` or `fix` and says so in the body.

## Database

- Before release 1.0, grimoire runs nowhere in production: change the schema directly, migrations are neither maintained nor considered.
- Last step before 1.0: squash all migrations in `app/src/lib/server/db/migrations/` into a single `0001` and sign off the final schema.
- From 1.0 on: migrations are forward-only and never edited (ADR 0001).
- With 1.0: describe schema updates on start, their rollback and `MIGRATE_ONLY` in
  `docs/handbook/database.md`; the section was dropped while 0.x has no update path, and its last
  text is in the history of that file.

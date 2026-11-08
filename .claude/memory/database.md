# Database

- `app/src/lib/server/fixtures/export-schema-4.grimoire-export` is never written again. It stands
  for exports made by 1.4.0; specs and the image smoke import it through every later migration.
  Its private source arrives as internal, its users without identities.
- A new column of an exported table fails `instance-export.spec.ts` until it is listed in
  `EXPORTED_COLUMNS` or `RUNTIME_COLUMNS`; a new table until it is in `EXPORTED_COLUMNS` or
  `EMPTIED_TABLES`. A new kind of stored secret would travel encrypted: export and import handle
  only `sources.encrypted_token`.

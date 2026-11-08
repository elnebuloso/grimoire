# Agent environment

Try changes by hand in the agent environment, never in `make dev`: that one is the developer's,
with their `app/.env` and their database. The agent environment is a dev server at
`http://localhost:5174` with its own settings, database and generated files in `app/.agent/` (not
committed); `make agent-start` starts it, `make agent-stop` stops it, and `make agent-reset`
rebuilds its data – reset after anything that changed the data or the schema, before the next
check starts from an assumed state. Logins, fixture sources, mail and identity providers are in
`.claude/memory/trying-by-hand.md`.

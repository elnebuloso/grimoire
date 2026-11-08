# Runtime

- Inside the image, Node resolves `localhost` to `::1` first; on the dev machine and the CI runners
  to `127.0.0.1` alone. A test server for both listens on both loopback addresses.
- `node:sqlite` errors carry `code: 'ERR_SQLITE_ERROR'`; a locked database has `errcode` 5.

- Node 24: `node:sqlite` with FTS5 is built in; `node` loads `.ts` files directly (type
  stripping), which tests use to run code in child processes.
- What Node loads without a build (`scripts/` and everything they import) uses no TypeScript
  parameter properties, which type stripping rejects, and imports relatively with the `.ts`
  extension.

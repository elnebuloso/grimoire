# SvelteKit on the server

- `.env` reaches only declared variables, not `process.env`. A variable whose name is not known
  ahead (such as `OIDC_<KEY>_ISSUER`) comes from `process.env`; `make dev` loads `app/.env` there
  with `node --env-file-if-exists`, which `NODE_OPTIONS` does not accept.
- `ServerInit` comes from `@sveltejs/kit/hooks`. adapter-node awaits `init` before it listens.
- adapter-node 6 has no `ORIGIN` variable: the origin is `paths.origin` from the config, else
  derived per request with protocol `https` unless `PROTOCOL_HEADER` names a header. Form POSTs
  over plain `http` therefore fail the CSRF check; test locally with
  `PROTOCOL_HEADER=x-forwarded-proto` and `X-Forwarded-Proto: http`.
- The dev server skips the CSRF origin check (`!__SVELTEKIT_DEV__` in SvelteKit's `respond.js`): a
  form POST with a foreign `Origin` passes there. Try CSRF against the build, never against
  `make dev` or the agent environment.
- On a `csr = false` page `resolve()` writes relative links (`../login`): an e2e test follows the
  link and checks the URL instead of comparing `href`.

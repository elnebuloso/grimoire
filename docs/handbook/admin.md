# Admin area

The admin area at `/admin` manages projects, sources and API keys. It has one local admin
account, set up in the browser on first start.

## First start

While there is no admin account, every page of the admin area leads to `/admin/setup` instead of
the login. Setting up needs a one-time setup token, which grimoire writes to its log on start:

```text
No admin account yet. Set it up at /admin/setup with the setup token 7GQm…
```

Enter the token, a username and a password of at least 12 characters. Only someone who can read
the server log can set up the account, even if the URL is reachable before you get to it. The
token exists only in memory: a restart before the setup logs a new one, and once the account
exists `/admin/setup` is gone.

## Logging in

A login lasts 12 hours. The password is stored only as a scrypt hash. After 10 failed logins from
one address, that address is blocked for 15 minutes.

The admin forms check that a request comes from grimoire's own origin. grimoire assumes `https`;
behind a reverse proxy that terminates TLS this works as is. Served over plain `http`, or behind
a proxy that sends the original protocol in a header, set `PROTOCOL_HEADER` to that header (for
example `x-forwarded-proto`), otherwise every admin form is rejected with
`Cross-site POST form submissions are forbidden`. Behind a proxy, also set `ADDRESS_HEADER` (for
example `x-forwarded-for`), so failed logins are counted per client and not for the proxy.

## Lost password

Delete the admin account with the script in the container:

```bash
docker exec -it grimoire node scripts/reset-admin.ts
```

It asks for the username of the admin account and deletes it, together with all sessions, only
when the name matches; without a terminal (no `-it`) it refuses to run. grimoire keeps running,
logs `Admin account was reset.` and a new setup token, and the admin area offers the setup again.

The script cannot be protected by a password of its own: whoever can run commands in the
container can read the database anyway. What protects the admin account is who may use
`docker exec` or `kubectl exec`.

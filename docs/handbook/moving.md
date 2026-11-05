# Moving an instance

!!! info "Prerequisites"
    - Reader: operator.
    - Required access: an admin account on the instance you move from, and the log or a shell of
      the grimoire container you move to.
    - The new instance runs the same grimoire version as the old one, or a newer one.

A [backup](database.md#backups) restores an instance that keeps its `ENCRYPTION_KEY`. Whenever the
key changes – a new instance with a key of its own, or a new key for the same instance – use an
export instead: a backup copied there would leave every access token unreadable.

## What an export carries

An export is one file with the sources with their access tokens and visibility, the users
with their roles and passwords, the API keys with their owners and the sources they reach, and the
settings. It leaves behind:

- the pages, snippets and links: they come back with the first sync of each source on the new
  instance, which starts within 15 seconds of the import – unless the export had **Pause all
  syncs** on, which it carries over;
- the sessions: everybody logs in again;
- invitations and password reset links not used yet: send them again;
- the sync history, the queries without results, and the request counts of the API keys.

## Export

On the old instance, an admin opens `Settings` in the management area and enters a passphrase of at
least 12 characters twice under **Export**. The download is named after the instance and the day,
such as `acme-docs-2026-11-04.grimoire-export`.

!!! danger "Keep the file like a password"
    The file and its passphrase together reveal the access token of every source. Nobody can
    recover a lost passphrase: without it the file cannot be imported. Delete the file once it is
    imported.

### `The access token of … cannot be read with the encryption key of this instance`

The instance was started with another `ENCRYPTION_KEY` since the named sources stored their token.
An admin enters the token again on the page of each source, or removes it there, and exports again.

## Import

An export goes only into an instance that has no users and no sources: start the new instance with
an empty volume and its own `ENCRYPTION_KEY`. Import it either on the setup page or with the script.

### On the setup page

1. Take the setup token from the log of the new instance (see [Setup token](docker.md#setup-token)).
2. Open `/setup` and fill in **Or import an export** with the token, the file and its passphrase.
3. Log in with an account from the export.

The server accepts uploads up to 512 KB; a larger export is refused with status `413`. Raise
`BODY_SIZE_LIMIT` on the new instance, such as `BODY_SIZE_LIMIT=10M`, or use the script.

### With the script

Copy the file into the container, import it, and delete it there. The script asks for the
passphrase without showing it:

```bash
docker cp ./acme-docs-2026-11-04.grimoire-export grimoire:/tmp/import.grimoire-export
docker exec -it grimoire node scripts/import.ts /tmp/import.grimoire-export
docker exec grimoire rm /tmp/import.grimoire-export
```

On Kubernetes:

```bash
kubectl cp ./acme-docs-2026-11-04.grimoire-export <pod>:/tmp/import.grimoire-export
kubectl exec -it deployment/grimoire -- node scripts/import.ts /tmp/import.grimoire-export
kubectl exec deployment/grimoire -- rm /tmp/import.grimoire-export
```

It ends with a line such as `Imported 2 users and 14 sources.`, followed by a line
`Source <slug> cannot sync: The server may not connect to <host>. …` for each imported source on a
Git host this instance refuses; an import on the setup page writes these lines to the server log.
List those hosts in `GIT_ALLOWED_HOSTS` (see [Git servers](docker.md#git-servers)) and restart, or
the sources fail their syncs. The server may run meanwhile; its setup page ends with the import.
Without `-it` the script stops with `Run this in a terminal: it asks for the passphrase of the
export.`

### Refused imports

Nothing is written when an import is refused.

| Message | Cause and fix |
|---|---|
| `This instance has users or sources already; an export is imported only into an empty one.` | Start the new instance with an empty volume. After an admin reset the sources are still there, so the setup page refuses the import too. |
| `The passphrase is wrong, or the file was changed or cut short since it was exported.` | Check the passphrase; otherwise copy the file again, completely, or export again. |
| `The export comes from a newer grimoire. Import it into that version or a later one.` | Update the new instance to at least the version that exported. |
| `The file is not a grimoire export.` | Choose the `.grimoire-export` file of the export. |

## Changing the encryption key

1. Export the instance.
2. Take a [backup](database.md#backups): it is the way back if the import fails.
3. Stop grimoire, give it an empty volume and the new `ENCRYPTION_KEY`, and start it.
4. Import the export.
5. Delete the export, and once the new instance works, the old volume.

Sessions, sync history and queries without results do not survive the change.

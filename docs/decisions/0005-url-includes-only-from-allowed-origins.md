# 0005 – URL includes only from origins the operator allows

| | |
|---|---|
| Status | Proposed |
| Date | 2026-10-29 |
| Deciders | Projectowner |
| Covers | Which addresses grimoire fetches when a page includes a file by URL (`--8<-- "https://…"`) |

## Context

pymdownx.snippets can include files by URL when a site sets `url_download: true`. To index such a
page as the site renders it, grimoire has to fetch the file while it syncs. The URL comes from
whoever can commit to the source repository, and the request leaves from the grimoire server,
which usually sits inside a network with services nobody outside may reach: other internal
applications, admin interfaces, the metadata endpoint of a cloud host. Without a limit, a commit
could make grimoire request any of them and index the answer, where agents then read it.

## Decision

- **URL includes are fetched only from origins the operator lists** in the deployment
  configuration, as `https://` origins. Without a list, no URL include is fetched on the instance,
  whatever a site config says.
- **The site config still has to switch them on** with `url_download: true`, as for pymdownx; the
  operator's list is the limit, not the switch.
- **A request follows no redirect**, sends no credentials, and stops after a fixed time and size.
  A redirect would lead to an origin the list does not name.
- **Whatever is not fetched is a warning of the source**, never a failed sync.

## Consequences

- An internal documentation server can serve includes once the operator lists it; nothing else
  inside the network is reachable through an include.
- Setting up URL includes needs the operator, not only someone who can commit to the source.
- A file moved behind a redirect has to be listed under its new address.

## Rejected alternatives

**Block internal addresses and allow everything else.** The obvious one: no configuration, and the
known dangerous targets are out. But it has to resolve each host and refuse private, loopback,
link-local and metadata addresses in every notation, and keep the resolved address for the request
so a second lookup cannot swap it, which is easy to get subtly wrong. And it forbids exactly what
an internal documentation tool most likely includes from: another internal server.

**Allowlist and an internal-address block together.** Safest on paper, but an internal
documentation server could then never be listed, which leaves the allowlist with little to do.

**Trust `url_download: true` in the site config.** The site config is written by the same people
who choose the URLs, so it limits nothing.

**The list as a setting in the management area.** Which addresses grimoire may reach is a question
of the network it runs in, answered with the deployment by whoever operates it, not by whoever
manages sources in the app.

## Revision

Reopen when includes have to come from origins that cannot be named in advance, or when grimoire
gets an outbound proxy that enforces the same limit itself.

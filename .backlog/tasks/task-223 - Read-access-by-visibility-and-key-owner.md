---
id: TASK-223
title: Read access by visibility and key owner
status: Done
assignee:
  - '@claude'
created_date: '2026-11-03 00:29'
updated_date: '2026-11-03 00:46'
labels:
  - admin
milestone: m-2
dependencies:
  - TASK-222
references:
  - app/src/lib/server/agent/
  - app/src/routes/+page.server.ts
priority: high
type: feature
ordinal: 285000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
With three visibility levels and keys owned by users, every reading path has to apply the same rule, or a private source leaks through the one path that was missed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Without a key, the HTTP API, MCP and the start page read and list only `public` sources
- [x] #2 A key reads `public` and `internal` sources and the `private` sources of its owner, within its own selection; "all sources" means all of these
- [x] #3 A key of an admin does not read another user's `private` source
- [x] #4 The start page lists for a logged-in user `public`, `internal` and their own `private` sources, for a visitor only `public` ones
- [x] #5 The query page of the management area searches what the logged-in user may read
- [x] #6 Tests cover each level for a visitor, the owner's key, another user's key and an admin's key
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. readableSlugs(db, userId): public, internal and own private slugs.
2. scopeForKey resolves every key to a slug list within what its owner may read, on each request (all = readable, selection = selection ∩ readable).
3. Start page filters the source list: visitor public only, logged-in user readableSlugs.
4. Management query page searches readableSlugs of the logged-in user.
5. Specs per level; try in agent environment with both fixture keys.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Keys no longer resolve to 'all': scopeForKey (api-keys.ts) returns the slugs the key's owner may read (readableSlugs), intersected with its selection, so a source made private later drops out of other users' keys at once. HTTP, MCP and llms.txt use that scope; requests without a key keep the 'public' scope. The start page lists public sources to visitors and readable ones to users; the management query page searches readable sources of the logged-in user, admins included. The 'all' scope remains only for the admin page preview. Tests: api-keys.spec (owner/other/admin/ownerless key, source made private, keyless), page.spec (listing per viewer), query.spec (own vs. other private). make test --project=server: 711 passed. Agent environment: admin key lists billing-archive but not the user's platform-next, user key the reverse, no key only billing-docs.
<!-- SECTION:FINAL_SUMMARY:END -->

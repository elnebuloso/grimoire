---
id: TASK-73
title: Slug rename is only complete after a successful re-sync
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 00:14'
labels:
  - sync
milestone: m-0
dependencies:
  - TASK-72
references:
  - app/src/lib/server/parsing/chunk.ts
  - app/src/lib/server/parsing/links.ts
  - app/src/lib/server/db/links.ts
priority: medium
type: bug
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review on 2026-10-30.

Project and source slugs are baked into the indexed content:
- the title path starts with project and source slug (`app/src/lib/server/parsing/chunk.ts:107`) and is stored and searched as the snippet heading;
- relative links are rewritten to full IDs inside `snippets.content` (`app/src/lib/server/parsing/links.ts:52,74`);
- `links.target` stores them too.

That is why the slug actions queue forced syncs (`app/src/routes/manage/projects/[id]/+page.server.ts:51-55`, `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts:156-159`). If that sync fails (broken token, unreachable host: on every attempt), the index keeps old IDs indefinitely. The source answers `read` under its new slug, but links inside its content lead agents to "not found", and nothing marks them dead because dead-link detection also runs only on sync. Renaming a project with 50 sources costs 50 forced full clones.

Review suggestion: store slug-free data (source-relative file and anchor) and add the slugs when content is rendered, or rewrite the stored prefixes in the same transaction as the slug `UPDATE`. Either way a rename becomes one write that cannot half-fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After renaming a project or source slug, search, `read` and links inside content use the new slug immediately, without a sync
- [ ] #2 A rename no longer queues forced syncs
- [ ] #3 Tests cover a rename of a project slug and of a source slug, including links between sources
<!-- AC:END -->

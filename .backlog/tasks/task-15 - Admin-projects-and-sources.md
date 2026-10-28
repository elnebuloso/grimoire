---
id: TASK-15
title: 'Admin: projects and sources'
status: To Do
assignee: []
created_date: '2026-10-28T19:32:00Z'
updated_date: '2026-10-28T20:42:00Z'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-2
  - TASK-14
documentation:
  - docs/konzept.md
priority: high
type: feature
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Projects group sources; a source is one Git repo with branch and exactly one path. Several paths of a repo are separate sources. Access tokens are secrets: they can be set but never read back.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Projects can be created, edited and deleted (slug, short description)
- [ ] #2 Sources can be created, edited and deleted (slug, HTTPS Git URL, branch, path, exclusions, user, token)
- [ ] #3 Slugs are validated; a duplicate source slug within a project is shown as an error
- [ ] #4 The token is write-only: never rendered, editing a source without entering a token keeps the old one
- [ ] #5 Git URLs are always shown without credentials
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Handoff from TASK-25: store a source token with `encryptToken(token, TOKEN_ENCRYPTION_KEY)` in `sources.encrypted_token`; never send the stored or clear value back to the browser.
<!-- SECTION:NOTES:END -->

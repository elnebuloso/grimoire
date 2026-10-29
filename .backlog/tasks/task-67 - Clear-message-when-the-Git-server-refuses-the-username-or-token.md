---
id: TASK-67
title: Clear message when the Git server refuses the username or token
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 22:51'
updated_date: '2026-10-29 22:54'
labels:
  - sync
milestone: m-0
dependencies: []
priority: medium
type: enhancement
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a Git server refuses the credentials of a source, Git asks for others and, since grimoire never lets it prompt, ends with `fatal: could not read Username for 'https://<host>': terminal prompts disabled`. TASK-38 found this message on GitLab, GitHub and Forgejo alike, at **Test connection** and as sync error. It reads like a missing username and does not tell the admin that the token is wrong, expired or revoked, or that the repository needs one.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 When the Git server refuses the username and token of a source, Test connection and the sync error say that the server refused them, not that a username could not be read
- [x] #2 When a source has no token and the server asks for credentials, the message says the repository needs a username and token, or does not exist at that URL
- [x] #3 Other Git errors keep their message as today, and no message contains the token
- [x] #4 Tests cover both cases against a server that refuses the credentials, and `docs/handbook/admin.md` shows the new message
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. git.ts: when Git's output says it wanted to ask for credentials ('could not read Username/Password for'), replace it with a message that depends on whether the source sends a token; REFUSED still classifies both as refused.
2. Tests in git.spec.ts against a local HTTP server answering 401 like the Git hosts do; handbook paragraph from TASK-38 updated.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The message is replaced in the shared git() call, so Test connection (as detail of 'Access refused …') and the sync error both get it. Other Git errors keep Git's text. Verified: make lint, make test (448), make e2e (15), make handbook; live against GitHub with an invented token (refused the username and token), without a token (asks for a username and token) and an unknown host (Git's own message unchanged).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
When a Git server refuses the credentials of a source, Test connection and the sync error now say 'the Git server refused the username and token: wrong, expired or revoked, or without access to this repository' instead of Git's 'could not read Username … terminal prompts disabled'. Without a token they say the repository needs a username and token, or does not exist at that URL. Other Git errors are unchanged; no message contains the token. Covered by tests against a local server answering 401, checked live against GitHub; docs/handbook/admin.md updated.
<!-- SECTION:FINAL_SUMMARY:END -->

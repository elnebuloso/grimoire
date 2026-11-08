---
id: TASK-395
title: 'Spike: tell documentation owners what to fix next, from what agents do'
status: To Do
assignee: []
created_date: '2026-11-08 19:22'
labels:
  - agent-api
  - admin
dependencies: []
priority: low
type: spike
ordinal: 457000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idea (owner conversation, 2026-11-08): grimoire sees what no other tool sees, which documentation agents actually need and where it fails them. Turned into a list per source ranked by impact ("read often, reported outdated twice, last commit 18 months ago", each with its `Edit:` file), it tells documentation owners what to write or fix next, and answers the question from user feedback whether knowledge is current and trustworthy from real use rather than from metadata written by hand (see TASK-394). Today grimoire records queries without results (`missed_queries`) and requests per API key and day (`api_key_requests`); it does not count which snippets `query` returns or `read` opens, and agents have no way to report a wrong or outdated snippet. A report would be stored in grimoire, never written to a repository: grimoire only reads Git (`docs/CONCEPT.md`). The agent instructions are at 995 of 999 characters (`operations.spec.ts`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The notes say which usage signals could be recorded per snippet or page (returned by `query`, opened by `read`), what that costs in writes per request and storage, and how long they would be kept
- [ ] #2 The notes sketch a report tool for agents: its input, how it is limited against abuse per API key, and how it fits into the agent instructions within their character limit
- [ ] #3 The notes say how the signals, queries without results and the date of the last commit of a page could be combined into one ranked list per source, and where in the management area it would live
- [ ] #4 The notes end with a recommendation for the owner: no change, or follow-up tasks in the order they should be built
<!-- AC:END -->

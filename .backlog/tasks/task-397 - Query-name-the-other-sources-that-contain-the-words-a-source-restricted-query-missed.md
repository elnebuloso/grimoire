---
id: TASK-397
title: >-
  Query: name the other sources that contain the words a source-restricted query
  missed
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:27'
updated_date: '2026-11-08 19:33'
labels:
  - search
  - agent-api
dependencies: []
priority: medium
type: feature
ordinal: 459000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An agent that passes `sources` to `query` picks them by name and short description. When it picks the wrong one, the answer is "No results … Try other terms, or look at a source's `index`." or names the words under "Not in any searched source:", although the words are in another source the agent may read. The hint sends the agent to rephrase instead of to the right source, and the question lands in the queries without results as a gap in the documentation that is none. A query across all sources is not affected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A query restricted to sources that leaves words unknown (no results, or "Not in any searched source:") names the other sources in the caller's scope that contain at least one of those words
- [x] #2 Sources the caller may not read are never named, also not to a visitor without a key
- [x] #3 A query across all sources, and a restricted query without unknown words, answers as before at no extra cost
- [x] #4 Specs cover the hint, the scope rule and the unchanged cases; the agent instructions and the handbook say what the agent does with the hint where needed
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. searchHits (app/src/lib/server/search/query.ts): when `sources` is given and words stay unknown, one extra FTS query lists the other sources in scope that contain any of them (sorted, capped); returned as `elsewhere`. No query in any other case. Also keep the unknown words when nothing is found (today the early returns drop them).
2. querySources (app/src/lib/server/agent/operations.ts): the no-results text and the "Not in any searched source:" line name those sources.
3. Specs in query.spec.ts / operations.spec.ts: hint with hits and without, scope (internal source hidden from a public scope), unrestricted query and restricted query without unknown words unchanged.
4. Handbook (search.md / agents.md) where it describes these lines; agent instructions only if the hint does not explain itself (995 of 999 characters).
5. Missed-query recording stays as it is.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. Specs: query.spec.ts (hint with and without hits, most matches first, scope, unrestricted and complete restricted queries look for nothing), operations.spec.ts (no-results text). Tried by hand in the agent environment over HTTP: `q=invoice&source=platform-docs` answers "No results for \"invoice\". Found in other sources: billing-docs."; with hits the line follows "Not in any searched source:"; a visitor asking `platformctl` in public `billing-docs` gets the old text, the admin key gets `platform-docs` named. `make test TEST=--changed`: 206 passed. Agent instructions unchanged: the hint names what to do itself and they are at 995 of 999 characters. Missed-query recording unchanged. Not measured: how often agents pick the wrong source in practice.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A query restricted to sources whose words are missing there now names up to five other sources the reader may see that contain them, most matches first: "Found in other sources: …" after "Not in any searched source:", or in place of "Try other terms …" when nothing was found. The lookup runs only on that path; unrestricted queries are unchanged. Handbook (search.md, agents.md) updated. Risk: none known; how often it helps in practice is not measured.
<!-- SECTION:FINAL_SUMMARY:END -->

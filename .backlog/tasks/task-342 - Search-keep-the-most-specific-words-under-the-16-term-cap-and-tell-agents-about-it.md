---
id: TASK-342
title: >-
  Search: keep the most specific words under the 16-term cap and tell agents
  about it
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 22:06'
updated_date: '2026-11-06 22:46'
labels:
  - search
  - agent-api
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/instructions.md
priority: low
type: enhancement
ordinal: 404000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-305, `toMatchExpression` in `app/src/lib/server/search/query.ts` keeps the first 16 distinct words of a question (`MAX_SEARCH_TERMS`). Long agent questions start with filler: "How do I configure the retry policy and the timeout for outgoing HTTP requests in the payment gateway service?" has 17 distinct words; "how", "do", "i", "the", "and", "for" and "in" are kept, and "service" is dropped. The handbook (`docs/handbook/agents.md`) names the cap, but the server instructions agents actually read (`app/src/lib/server/agent/instructions.md`, quoted in `docs/ARCHITECTURE.md`) do not.

Suggested fix: sort the distinct words by length, longest first, before `slice(0, MAX_SEARCH_TERMS)` (BM25 ranking is unaffected by term order). Add to the `query` line of the instructions that only the first 500 characters and 16 different words count, keeping the instructions under their 250-token budget (`docs/ARCHITECTURE.md`), and update the quote in `docs/ARCHITECTURE.md`.

Found by the second whole-repo audit on 2026-11-06 (HEAD 06aada8).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For a question with more than 16 distinct words, the longest ones are searched
- [x] #2 The agent instructions and their quote in `docs/ARCHITECTURE.md` name the cap
- [x] #3 The specs of TASK-305 in `query.spec.ts` are adjusted and a spec covers the choice of words
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec replacing the TASK-305 cap spec: 16 short words before rollback still find it, 16 long words push it out, a 18-word agent question with rollback as 17th word finds it
2. toMatchExpression sorts the distinct words by length, longest first (stable), before the cap
3. Agent instructions (within the 250-token spec), their quote in docs/ARCHITECTURE.md and handbook agents.md name the cap
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- The spec failed before and passes after; search, agent and agent-api specs pass (90 tests), including the 250-token limit of the instructions (first wording was 251, shortened). make handbook passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A question with more than 16 different words now searches its 16 longest ones instead of the first 16, so the specific terms at the end of a long agent question ("… the payment gateway rollback?") are no longer dropped for "how do I". The agent instructions, their quote in docs/ARCHITECTURE.md and the handbook say that only 16 words count. Covered by a spec in query.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-351
title: 'Search: drop stopwords before choosing the 16 search terms'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 23:46'
updated_date: '2026-11-07 00:13'
labels:
  - search
  - agent-api
dependencies: []
references:
  - app/src/lib/server/search/query.ts
priority: medium
type: enhancement
ordinal: 413000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since TASK-342, `toMatchExpression` in `app/src/lib/server/search/query.ts` (around lines 205-214) keeps the 16 longest distinct words of a question (`MAX_SEARCH_TERMS`), ties broken by position. Short technical terms then lose against filler words of the same or greater length.

Case: "How do I rotate the signing key for SSO tokens when the identity provider of the billing service changes its certificate and the old JWT must keep working?" keeps `how`, `the`, `when`, `must`, `keep` and drops `sso` and `jwt` – exactly the most specific terms.

Suggested fix: remove a short stopword list (English and German, since questions come in both; e.g. how, do, i, the, a, and, of, for, to, in, is, when, must, wie, der, die, das, und, ist, …) before sorting by length. Keep a question made only of stopwords searchable (fall back to the words as they are). The agent instructions (`app/src/lib/server/agent/instructions.md`, quoted in `docs/ARCHITECTURE.md`, 250-token limit checked by `operations.spec.ts`) and `docs/handbook/agents.md` describe the 16-word cap; adjust them if the wording no longer fits.

Found by the third whole-repo audit on 2026-11-07 (HEAD 4a72798).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For a long question, stopwords are not among the searched terms and short technical terms like `sso` and `jwt` are
- [x] #2 A question made only of stopwords still searches
- [x] #3 Specs in `query.spec.ts` cover both, and the specs of TASK-305 and TASK-342 still pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Spec: the long SSO/JWT question finds a page that only matches sso and jwt; a question of stopwords only (`how to`) still searches
2. query.ts: STOPWORDS (English and German) are left out before the longest-words cap; when nothing else is left, the words are searched as they are
3. Handbook agents.md names it; the agent instructions stay within their 250-token budget unchanged
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Stopwords are left out always, not only above the cap: they add matches on nearly every page and nothing to the ranking.
- The spec failed before and passes after; search, agent, agent-api and start page specs pass (102 tests), including the specs of TASK-305 and TASK-342. make handbook passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Common English and German filler words are now left out of a search before the 16 longest words are chosen, so short technical terms of a long question (`sso`, `jwt`) are searched instead of `when` or `must`; a question made only of such words is searched as it is. Covered by a spec in query.spec.ts; the handbook says so.
<!-- SECTION:FINAL_SUMMARY:END -->

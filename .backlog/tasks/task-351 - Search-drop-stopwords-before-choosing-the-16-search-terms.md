---
id: TASK-351
title: 'Search: drop stopwords before choosing the 16 search terms'
status: To Do
assignee: []
created_date: '2026-11-06 23:46'
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
- [ ] #1 For a long question, stopwords are not among the searched terms and short technical terms like `sso` and `jwt` are
- [ ] #2 A question made only of stopwords still searches
- [ ] #3 Specs in `query.spec.ts` cover both, and the specs of TASK-305 and TASK-342 still pass
<!-- AC:END -->

---
id: TASK-369
title: 'Search: tell agents when a question has no good match'
status: To Do
assignee: []
created_date: '2026-11-07 02:53'
labels:
  - search
  - agent-api
dependencies: []
references:
  - app/src/lib/server/search/query.ts
  - app/src/lib/server/agent/operations.ts
  - docs/handbook/search.md
priority: medium
type: feature
ordinal: 431000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`query` joins the words of a question with OR (`toMatchExpression` in `app/src/lib/server/search/query.ts`), so any snippet sharing one word with the question is a hit. In the benchmark (`make benchmark`, `app/benchmark/baseline/*.search.json`), all 16 questions that have no answer in their documentation (e.g. "How do I create and apply Django ORM migrations with makemigrations?" on FastAPI, Terraform state locking on Kubernetes) returned hits – up to 20 each. An agent cannot tell "not covered" from a weak match, and the admins' list of queries without results (`missed_queries`) never sees these questions.

Goal: an answer that says when the best hit matches little of the question, for example how many of the searched words the hit contains, or a threshold below which the answer reads as "no good match" and the question is recorded as missed. Decide the rule with the benchmark: the unanswerable questions should mostly end as no match, while the share of answerable questions found within 10 must not drop. The rule and what the agent sees belong in the agent instructions (`app/src/lib/server/agent/instructions.md`, 250-token limit checked by `operations.spec.ts`), `docs/handbook/search.md` and `docs/handbook/agents.md`.

Found while building the benchmark (TASK-364/365) on 2026-11-07.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `make benchmark` shows most unanswerable questions answered as no good match
- [ ] #2 The number of answerable questions found within 10 does not drop against the baseline before the change
- [ ] #3 The answer format, the agent instructions and the handbook describe what an agent sees
- [ ] #4 Questions answered as no good match are recorded as missed queries for keyed callers
<!-- AC:END -->

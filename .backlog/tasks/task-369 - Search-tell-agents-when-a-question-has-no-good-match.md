---
id: TASK-369
title: 'Search: tell agents when a question has no good match'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-07 02:53'
updated_date: '2026-11-07 10:44'
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
- [x] #2 The number of answerable questions found within 10 does not drop against the baseline before the change
- [x] #3 The answer format, the agent instructions and the handbook describe what an agent sees
- [x] #4 Questions answered as no good match are recorded as missed queries for keyed callers
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. search/query.ts: searchTerms() shared by the match expression; unknownTerms(): searched words that match no snippet in the caller's scope and the asked sources (no leak from hidden sources)
2. searchHits appends 'Not in any searched source: …' when hits exist and some words are unknown; SearchResult carries unknown
3. Migration 0009: missed_queries.unknown_words (JSON array, NULL = nothing found); recordMissedQuery/listMissedQueries carry it
4. agentQuery records a keyed query that found nothing or had unknown words
5. /manage/missed-queries: column for the unknown words; texts in every locale; intro adjusted
6. instructions.md (250-token limit), docs/handbook/search.md, agents.md, the admin page of the list
7. Specs: query.spec (unknown words, scope), operations/agent spec (recording), missed-queries.spec, route spec; benchmark unchanged (ranks only)
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured 2026-11-07 (temporary harness over the benchmark databases, search with the stopword list of TASK-370; 16 unanswerable, 104 answerable questions, 90 of them found within 10).

1. Share of searched words in the best of the top 10 hits, as a threshold: no separation. < 0.67 flags 5/16 unanswerable but 17/90 found; < 1.0 flags 16/16 but 32/90 found; 'misses >= 2 words' 6/16 vs 17/90. Rejected: the best hit of an unanswerable question usually shares most generic words ("PostgreSQL connection pool API server").
2. Words that occur in no snippet of the searched sources: every unanswerable question has at least one (dynamodb, makemigrations, fargate, stripe, redux, jwt, algolia ...). But 43/104 answerable ones too: 16 German questions (German words in English docs), 12 typos, 11 long questions with rare filler (bunch, honestly), 4 others. As a 'no good match' threshold it would mark every German question about English docs as not covered: rejected under the multilingual requirement.
3. Proposal for the owner (not built): no threshold, no hiding of hits (within 10 stays unchanged by construction). The answer adds one line naming the searched words that occur in no searched source, e.g. `Not in any searched source: dynamodb`. An agent reads it as "the documentation does not cover this" when the word is the subject, and as "rephrase in the documentation's language or fix the spelling" for German words and typos – which also helps multilingual use. A keyed query with such words is recorded as missed, with them, so admins see vocabulary gaps (wanted topics, missing German terms). Costs one indexed lookup per searched word (at most 16).

Owner decision (2026-11-07): no threshold; the answer names the words no searched source contains, and a keyed query with such words is recorded among the queries without results, with the words shown apart from 'Nothing found'.
Built: searchHits appends 'Not in any searched source: ...' (scope-checked, so a word of a hidden source never shows); agentQuery records it; migration 0009 adds missed_queries.unknown_words; /manage/missed-queries shows 'Words not found' / 'Nichts gefunden'. Agent instructions got the hint and were tightened to stay under 250 tokens (995 characters), without dropping a rule; ARCHITECTURE.md copy synced. Handbook: search.md, agents.md, admin.md. Glossary: 'nicht gefundene Wörter'.
Checked: agent environment by curl and browser (light and dark): an English word missing (terraform), a German one in English docs, and on a German page 'Abrechnungslauf' found while 'monatlich' is reported (the page says 'Monatlicher').
Performance: the first version looked words up through selectSnippets with ORDER BY, which sorts every match of a common word: search median 19 -> 31 ms, p95 52 -> 104 ms on Kubernetes (benchmark failed its 2x tolerance). Replaced by a lookup without ORDER BY that stops at the first match; BENCHMARK_RUNS=1 make benchmark passes all 12 (ranks, index and time within 2x). Full make test: 1334 passed.
AC #1 ('most unanswerable questions answered as no good match') is not met as written: the owner chose no threshold. Each of the 16 unanswerable questions now gets the line naming its uncovered words (measured in the harness: all 16 have at least one).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Answers with hits now end with 'Not in any searched source: <words>' when words of the question occur in no snippet the caller may read: a missing topic, a typo, or a question in another language than the documentation. Hits and ranks are unchanged. Keyed queries with such words are recorded under Queries without results with a 'Words not found' column (migration 0009). Agent instructions, handbook and German glossary updated. AC #1 replaced by the owner's decision against a threshold; all 16 unanswerable benchmark questions get the line.
<!-- SECTION:FINAL_SUMMARY:END -->

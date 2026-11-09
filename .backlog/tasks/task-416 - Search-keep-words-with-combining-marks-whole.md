---
id: TASK-416
title: 'Search: keep words with combining marks whole'
status: To Do
assignee: []
created_date: '2026-11-09 10:17'
labels:
  - search
dependencies: []
priority: low
type: bug
ordinal: 478000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### What this is
`SEARCH_WORD` in `app/src/lib/server/search/query.ts` (`/[\p{L}\p{N}_]+/gu`) decides which parts of a question count as words; each word becomes a quoted FTS5 term. `hasSearchTerms` and the 16-term cap (`MAX_SEARCH_TERMS`) use it too.

### Problem
Combining marks (`\p{M}`, such as vowel signs in Devanagari or Thai) are not in the class, so a word is cut wherever one stands. The question `हिन्दी` becomes the terms `ह`, `न`, `द`, searched as alternatives, which match almost every snippet in that script; ranking is close to random. FTS5's default `unicode61` tokenizer keeps such a word whole, so the quoted word would match correctly.

### Fix
`/[\p{L}\p{M}\p{N}_]+/gu`. Add a spec with a Devanagari word in a snippet that a query for the whole word finds first. Latin text is unaffected. Run `make benchmark` afterwards (search changed; no difference expected).

### If we skip it
No effect until an organisation indexes documentation in such a script; then search for it is effectively broken.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SEARCH_WORD includes \p{M}
- [ ] #2 A spec finds a Devanagari word as a whole word
- [ ] #3 make benchmark shows no difference
<!-- AC:END -->

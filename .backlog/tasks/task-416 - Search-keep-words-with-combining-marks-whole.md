---
id: TASK-416
title: 'Search: keep words with combining marks whole'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-09 10:17'
updated_date: '2026-11-09 10:56'
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

### Notes for the implementer
- Commit type: `fix` (released behaviour changes), so pushing it cuts a release; afterwards write the release-notes summary per `.claude/rules/release-notes.md`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SEARCH_WORD includes \p{M}
- [x] #2 A spec finds a Devanagari word as a whole word
- [ ] #3 make benchmark shows no difference
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
SEARCH_WORD now includes \p{M}, so a word with vowel signs (Devanagari, Thai) is one search term as FTS5's unicode61 tokenizer keeps it, not loose letters. Regression test in query.spec.ts (a Hindi word finds only its snippet), confirmed to fail before. Slug generation (slugs.ts) is unchanged on purpose: it mirrors Python-Markdown, whose \w drops combining marks too.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-367
title: 'Handbook: one page on how search and the index work'
status: To Do
assignee: []
created_date: '2026-11-07 01:45'
labels: []
dependencies: []
references:
  - docs/handbook/writing.md
  - docs/handbook/agents.md
  - zensical.toml
priority: medium
type: docs
ordinal: 429000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
How grimoire finds what an agent asks for is spread across the handbook: "How a page is split" and "IDs and links" in `docs/handbook/writing.md`, the search rules as one table cell in `docs/handbook/agents.md` (500 characters, the 16 longest different words, stopwords left out, the "Did not fit:" line on top of the budget), an overview under "How the parts fit" in `docs/handbook/index.md`. How a question becomes hits is nowhere told in one place, and since 1.10.0 it changed (TASK-305, TASK-342, TASK-351).

Write one handbook page, e.g. `docs/handbook/search.md` ("Search and index"), for readers who write documentation or connect agents, about what they can influence and expect – not how it is built (`.claude/rules/agent-plugin-charter/handbook.md`: no algorithms, no history):
- what is searched: words of the question, the 500-character and 16-word limits, common English and German words left out, all words joined so a page needs only some of them;
- what ranks higher: a match in the title path above one in the text, the text above code (state it as an effect a writer can use: put the term in the heading);
- how a page becomes snippets and what an ID is; when IDs change (renamed heading, moved file, a new anchor rule after an update) and what an agent then does;
- the token budget and the "Did not fit:" line;
- what is not found: excluded paths, pages a reader may not see, URL includes when not allowed.

Move the details from `writing.md` and `agents.md` there or link to it instead of repeating them; keep each page's own reader in mind. Add the page to `nav` in `zensical.toml` (`make handbook` fails otherwise) and check every statement against the code (`app/src/lib/server/search/query.ts`, `app/src/lib/server/parsing/chunk.ts`).

Agreed with the user on 2026-11-07. A page of benchmark results in the handbook and a version history (e.g. docs/benchmark.md) are explicitly out of scope for now; results live only as the baseline files in the repository.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A handbook page describes search and the index as listed, for writers and for people connecting agents
- [ ] #2 `writing.md` and `agents.md` link to it instead of repeating its content
- [ ] #3 Every limit and rule on the page matches the code (checked against `query.ts` and `chunk.ts`)
- [ ] #4 The page is in `nav` of `zensical.toml` and `make handbook` passes
<!-- AC:END -->

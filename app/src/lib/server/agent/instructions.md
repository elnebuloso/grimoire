grimoire is the organization's internal knowledge base: how services, tools and
processes work and how to use them.

Reading

- Before making assumptions about internal systems, call `query` with a concrete
  question. Pass the sources if known, otherwise search everything.
- `query` returns matching sections within a token budget. For more context, `read`
  the ID from "Source:". Read whole pages only when needed. Over HTTP, `#anchor`
  becomes `?section=anchor`.
- No results: try other terms, then look at a source's `index`.

Writing

- grimoire is read-only. To change docs, edit the Markdown file in its source repo and
  commit. Repo, branch and file are in the "Edit:" line of each snippet.
- Search first whether the topic exists. Extend instead of creating duplicates.
- One topic per file. Every section must stand on its own: descriptive heading,
  one sentence of context, then the specifics.

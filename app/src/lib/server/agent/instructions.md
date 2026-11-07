{INSTANCE_NAME} is the organization's internal knowledge base: how services, tools and
processes work and how to use them.

Reading

- Before assuming how internal systems work, call `query` with a concrete question.
  Pass the sources if known, else it searches all.
- `query` returns sections within a token budget; "Did not fit:" lists further IDs.
  Its 16 longest words count. For more, `read` the ID from "Source:", whole pages only
  if needed. Over HTTP, `#anchor` is `?section=anchor`.
- No results: try other terms, then a source's `index`. "Not in any searched source:"
  missing topic, typo, or ask in the docs' language.

Writing

- {INSTANCE_NAME} is read-only. To change docs, edit the Markdown file in its source repo and
  commit. Repo, branch and file: the "Edit:" line of each snippet.
- Search first whether the topic exists; extend it rather than duplicate it.
- One topic per file. Every section must stand on its own: descriptive heading,
  one sentence of context, then the specifics.

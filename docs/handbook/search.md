# Search and index

!!! info "Prerequisites"
    - Reader: an author who wants their documentation found, or whoever connects an agent and
      wonders why it gets the answers it gets.
    - Required access: none to read this page. An API key decides which sources a search covers
      (see [Your account and API keys](users.md)).

    New to grimoire? Read [Concepts](index.md) first.

An agent's `query` searches the snippets of the sources it may read and returns the best ones
that fit its token budget. A snippet is one section of a page: how a page becomes snippets and how
their IDs are built is under [How a page is split](writing.md#how-a-page-is-split) and
[IDs and links](writing.md#ids-and-links).

## Which words of a question count

| Rule | Example |
|---|---|
| Words are letters, digits and `_`; everything else separates them. | `auth-service` searches `auth` and `service`; `ENV=prod` searches `env` and `prod`. |
| Upper and lower case and accents make no difference. | `Über` finds `uber`; `JWT` finds `jwt`. |
| A word matches as written. | `rollback` does not find `rollbacks` while `rollback` occurs somewhere. |
| A word that occurs in no searched source is replaced by the most common word one letter away (a letter added, left out, changed or two swapped), else by the words that start with it; words under 4 letters are not replaced. | `rollbak` searches `rollback`; `monatlich` searches every word starting with `monatlich`, such as `monatlicher`. |
| Only the first 500 characters of a question count. | A pasted log beyond that is ignored. |
| Common English and German words are left out. | `how`, `the`, `when`, `wie`, `der`, `und`; a question of nothing but such words is searched as it is. |
| Of the rest, the 16 longest different words count. | A long question keeps its specific terms and drops short leftovers. |

A snippet matches when it contains any of these words. The more of them it contains, and the
rarer they are across all snippets, the higher it ranks.

## What ranks higher

- **A word in the title path counts ten times as much as one in the text**, and a word in a code
  block a quarter. The title path is the page title with the headings above the section, such as
  `auth-service › Deployment › Rollback`. Put the term people search for in the heading:
  `Rolling back a deploy`, not `Notes`.
- **A term that appears only in a code block** is found, but ranks low. Name commands, settings
  and error messages in the text as well when people will search for them.
- **Write the word people use**, singular and plural alike if both are common: `rollback` and
  `rollbacks` are different words to the search as long as both occur somewhere.

## What an answer holds

- At most 20 snippets, best first, as many as fit the token budget: 3000 tokens unless the agent
  asks for another. A snippet that does not fit is skipped and a smaller one after it still
  taken.
- A `Did not fit:` line names the IDs of the skipped ones, so the agent can `read` them. This line
  comes on top of the budget.
- A question that finds nothing answers with `No results for …` (the exact texts are under
  [Errors](agents.md#errors)). With an API key, such a question is listed for the admins under
  `Management > Quality > Queries without results`, and so is one with a
  `Not in any searched source:` line, with those words.
- `Not in any searched source:` closes an answer whose question has words that no snippet of
  the searched sources contains, such as
  `Not in any searched source: terraform, rollbak (searched as rollback)`. A word in brackets was
  searched in its place, as the rules above describe. Only the sources the reader may see count,
  also for a replacement.
- Because any one word matches, a question about something the documentation does not cover
  usually still returns snippets that share a word with it. That line tells the agent which part
  of the question is not covered: a topic the documentation lacks, a typo, or a question in
  another language than the documentation, which is worth asking again in its language.

## What is not searched

- Sources the reader may not see: without an API key only public sources, with a key the sources
  it opens and the public ones.
- Paths an admin excluded on the source, and pages a sync skipped; the source's page lists them as
  sync warnings.
- Content a page includes from a URL, unless the operator allows that URL's origin.
- Syntax grimoire does not know, such as Hugo shortcodes `{{< note >}}`: it stays text in the
  snippet and is searched as such.

## When IDs change

An ID stays as long as its file and its heading stay. It changes when:

- a heading is renamed without a fixed anchor (`{#rollback}`, see [IDs and links](writing.md#ids-and-links));
- a file is moved or renamed;
- an update of grimoire builds anchors closer to MkDocs and Zensical, as 1.10.0 did for headings
  with images and for custom anchors with non-ASCII characters. The new ID applies from the next
  sync of the source.

An agent that stored an old ID gets a not-found answer (see [Errors](agents.md#errors)); it finds
the section again with `query` or the source's `index`.

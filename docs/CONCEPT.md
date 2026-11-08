# grimoire – Concept

What grimoire is and how it works, as far as that holds whatever stack, interface and limits it is
built with. Decisions and the options they rejected are in `docs/decisions/`, how to use and run it
is in `docs/handbook/`, and how it is built is in the code. A statement that stops being true when
an implementation detail changes does not belong here.

## Idea

A central knowledge base for an organization, built for AI agents first. There, agents learn how
to use the organization's services, tools and processes, and they extend that knowledge
themselves.

The model is [Context7](https://context7.com): documentation is split into small snippets and
served selectively within a token budget. Unlike Context7, it is about **internal** knowledge, and
agents **write** it too.

## Principles

- **Git is the source of truth.** Humans and agents write Markdown in Git repositories. Versions,
  history, authorship, review and permissions to write come from Git and its host.
- **Humans read through MkDocs or Zensical.** Rendering documentation for people is not
  grimoire's job.
- **grimoire only reads:** it ingests, splits into snippets, searches and serves. It never writes
  back to a repository.
- **Little context for agents.** An agent never gets a whole documentation set, only the sections
  that match its question, within the budget it names.

## Flow

```
Git repository (docs/ …)
   │  a human or an agent changes Markdown → commit / merge request
   ▼
Sync ──► grimoire
          ├─ fetches the source's path
          ├─ splits it into snippets at its headings
          └─ replaces the source's search index
   │
   ├─► humans: the MkDocs/Zensical site
   └─► agents: sources / index / query / read
```

## Sources

A **source** is one documentation path in one Git repository, on one branch: what one MkDocs or
Zensical site renders. Two paths in one repository are two sources. Nothing groups sources; an
agent searches everything or names the sources it wants (ADR 0012). Each source has a slug, unique
on the instance, that is part of every ID it yields. The same repository path is registered once
(ADR 0014).

## Snippets

The whole page is stored; its sections are what is searched and served.

- **Every heading with its section becomes a snippet.** Size is corrected afterwards: a section
  that is too long is split at its subheadings, else between paragraphs, never inside a code
  block, table or list; a section too short to stand alone is merged into its parent.
- **Every snippet carries its title path**, such as `auth-service › Deployment › Rollback`, so it
  is understandable without the page around it.
- **The page is indexed as the site renders it.** What the site's Markdown extensions show a
  reader – admonitions, tabs, included files – is in the snippet; what a reader never sees is not.

From this follows the one writing rule for documentation: **every section must be understandable
on its own** – a descriptive heading, one sentence of context, then the specifics.

## IDs and links

- **An ID is `<source>/<page>#<anchor>`**, the anchor derived from the heading exactly as the site
  derives it, so an ID and the rendered page point to the same place.
- **Relative links become IDs.** An agent follows a link with `read`; links that lead nowhere are
  dead links, shown to whoever maintains the source.
- **An ID changes when its file or heading does.** Links to it die until the documentation is
  fixed; grimoire does not redirect.

## Output

A snippet reaches an agent as Markdown, headed by its title path and two lines:

- `Source:` – its ID, with which the agent reads on.
- `Edit:` – Git repository, branch and file: where to change it. Deliberately no web link, whose
  shape differs between Git hosts.

````
### auth-service › Deployment › Rollback
Source: auth-service/deploy#rollback
Edit: https://git.example.com/platform/auth-service.git (main) docs/deploy.md

On errors after a deploy, go back to the previous version:

```bash
make rollback ENV=prod VERSION=<tag>
```

> **Caution:** database migrations are not rolled back.
````

## Search

- **Full text, ranked by field.** A match in the title path counts most, then the text, code
  least. Internal documentation is full of proper names and commands, where exact words find more
  than similar meaning.
- **Everything, unless narrowed.** A query without sources searches every source the caller may
  read; with sources, only those.
- **Words no source holds are named.** The agent learns that a topic is missing or a word is
  misspelled instead of guessing from a weak hit.

## Token budget

A query names how many tokens its answer may take. The answer is filled like this:

1. take the hits in order of rank;
2. add each one that still fits;
3. skip one that no longer fits and try the next;
4. close with the IDs of the skipped hits, so the agent knows there is more and can `read` exactly
   what it needs.

## Sync

- **Git only.** grimoire speaks the Git protocol, never a host's API, so every Git server works
  the same.
- **Look before fetching.** A source is first asked whether its branch moved; only then is its
  path fetched – the path alone, plus the files its pages include.
- **Rebuilt whole, switched at once.** A changed source gets a complete new index, which replaces
  the old one in a single step. Agents never see half an index; deleted and moved files need no
  special handling.
- **The last good state stays.** A failed sync changes nothing agents read; the error is shown at
  the source. A file that cannot be read is skipped with a warning, and the rest is indexed.

## Interface for agents

Four operations:

| Operation | Returns |
|---|---|
| `sources` | the sources the caller may read, with their descriptions |
| `index <source>` | the pages and sections of a source |
| `query [<source>…] "<question>"` | matching snippets within the token budget |
| `read <id>` | a whole page or one section |

They are served over MCP and over HTTP from the same application, with the same content and the
same IDs; HTTP answers in Markdown, not JSON, so an agent can also fetch it as a plain web page.
A client sends no `#anchor` to the server, so over HTTP the anchor of an ID travels as a query
parameter instead.

## Instructions for agents

grimoire serves the instructions agents follow itself, written in one place: over MCP they arrive
when the server connects, over HTTP they are one request. They stay in an agent's context for the
whole session, so they are short. They say how to read and how to write documentation, never
when a change arrives: that is a question of operations, not of the agent.

## Writing

Agents change documentation where humans do: in the repository, by editing the file and
committing. grimoire tells them where through the `Edit:` line.

## Secrets

Access tokens never leave grimoire – not in an answer, an `Edit:` line, an error message or a log.
Git URLs are always shown without credentials.

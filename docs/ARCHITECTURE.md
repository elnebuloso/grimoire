# grimoire – Architecture

How grimoire works and why it is built this way. The decisions behind single parts are in
`docs/decisions/`, the visual design in `docs/DESIGN.md`, the product context for UI work in
`docs/PRODUCT.md`.

## Idea

A central knowledge base for an organization, built for AI agents first. There, agents learn how
to use your services, tools and processes, and they can extend that knowledge themselves.

The model is [Context7](https://context7.com): documentation is split into small snippets and
served selectively within a token budget. Unlike Context7, it is about **internal** knowledge,
and agents **write** it too.

An open-source project on GitHub. Code, docs and agent instructions are therefore in English;
the web UI is in English and German, with English as the fallback.

## Principles

- **Git is the source of truth.** Humans and agents write Markdown in Git repos (GitLab, GitHub,
  Forgejo, Gitea …). Versioning, history, authorship, review and permissions come from Git and
  the respective provider.
- **Humans read through MkDocs/Zensical.** Rendering for humans is not grimoire's job.
- **grimoire only reads:** ingest, split into snippets, search, serve.
- **Little context for agents.** Agents never get whole doc sets, only matching sections within a
  token budget.

## Flow

```
Git repo (docs/ …)
   │  human or agent changes Markdown → commit / MR / PR
   ▼
Sync (polling, button) ──► grimoire
                            ├─ fetches the configured path
                            ├─ splits it into snippets at headings
                            └─ updates the search index
   │
   ├─► humans: MkDocs/Zensical site
   └─► agents: sources / index / query / read
```

## Admin area

A **source** is a Git repo with a branch and exactly one path, with a name, a slug and a short
description. There is nothing above it.

```
Source: auth-service     main   docs/
Source: auth-handbook    main   handbook/      (same repo as auth-service)
Source: billing-service  main   docs/
Source: gateway          main   docs/
```

| Field | Example |
|---|---|
| Name | `Auth service` |
| Slug | `auth-service` – unique on the instance, part of the ID |
| Short description | "Login, sessions and tokens" – appears in `sources` |
| Git URL (HTTPS) | `https://gitlab.thoemo.net/platform/auth-service.git` |
| Branch | `main` |
| Path | `docs` – empty for the whole repository |
| Exclusions | `docs/drafts/**` (optional, glob patterns relative to the repository root) |
| Documentation site | `https://docs.example.com/platform/` (optional, linked for public sources) |
| Schedule | Cron expression, e.g. `0 * * * *` (optional, otherwise the global default) |
| Paused | polling skips the source; only "Sync now" syncs it |
| Public | anyone who can reach the instance may search and read it without an API key; off when created |
| User + token | The provider's read token (GitLab deploy token, GitHub fine-grained token, Forgejo/Gitea access token), stored encrypted |

Decisions:

- **One path per source.** If several paths of a repo are needed, the repo is added several times
  as a source, each with its own slug and a name saying what it holds. A source thus corresponds
  to exactly one MkDocs site (`docs_dir`), and files from different paths cannot end up with the
  same ID.
- **No grouping above sources.** Agents search everything, or name the sources they want; see
  ADR 0003 for why there are no projects.

Per source, the admin area shows: last check and sync, commit, number of pages, snippets and
tokens, sync errors and warnings, the sync history, and a preview of every page as the snippets
an agent gets. A "Test connection" button checks the Git access before saving; changing the slug
needs it typed as confirmation, because every ID of the source changes with it.

Beside the sources, the admin area has:

- an overview listing what needs attention: sources never synced, with errors or warnings;
- **API keys**, each for all sources or a selection, optionally valid until a date, with its last
  use; the key is shown once;
- **Try a query**, which returns exactly what `query` returns an agent;
- **Dead links** across all sources;
- **Queries without results**: questions agents asked that found nothing, kept for 30 days;
- **Settings** for the whole instance, today one switch that pauses the syncs of all sources
  (ADR 0002).

The start page is open to everyone: every source with its visibility and stats, a query against
the public sources and how to connect an agent.

**Secrets.** Access tokens are never output – not in the `Edit:` line, not in error messages,
logs or the API. Git URLs are always shown without credentials.

## Data model (rough)

| Object | Contents |
|---|---|
| Source | slug (unique), name, short description, Git URL, branch, path, exclusions, documentation site, schedule, public, paused, user, encrypted token, last check, last commit, last sync, errors/warnings |
| Page | belongs to a source; file path, title, description, tags, full text, position in the site navigation |
| Snippet | belongs to a page; anchor, anchors of merged subsections, title path, content, part of a split section, estimated tokens – in the FTS5 index |
| Link | from page/anchor to target ID; for backlinks and dead links |
| Sync run | belongs to a source; when, outcome (synced, unchanged, failed), commit, error |
| API key | name, hash of the key, allowed sources (all or a selection), created, last used, valid until |
| User | email address, password hash, roles (today only `admin`), sessions, password reset links |
| Missed query | a question that found nothing, with its sources and when it was asked |
| Settings | one row for the whole instance (ADR 0002) |

A source's pages, snippets and links are replaced completely on every sync (see Sync).

## Splitting into snippets

The whole page is stored; sections are what is searched and served.

- Every heading with its section becomes a snippet.
- Every snippet carries its **title path**, so it is understandable on its own:
  `platform › auth-service › Deployment › Rollback`.
- Every snippet points to its source, file and anchor.

Example: the page

```markdown
# Auth-Service
## Deployment
## Rollback
## Known issues
```

yields the snippets `auth-service#deployment`, `auth-service#rollback`,
`auth-service#known-issues`.

From this follows the writing rule for docs: **every section must be understandable on its
own** – a descriptive heading, one sentence of context, then the specifics.

### Rules

**Cutting.** At every heading; afterwards corrected by size. Target size of a snippet: about
100–800 tokens. The text under `#` before the first `##` becomes the snippet "Overview" and serves
as the page description in the index if the front matter has no `description`.

**Too long (over ~800 tokens).** Cut at subheadings first, otherwise at paragraph boundaries –
never inside code blocks, tables or lists. Parts are named `Rollback (1/2)`, `Rollback (2/2)`. A
single code block that is too long on its own stays whole.

**Too short (under ~50 tokens).** Merged into the parent section. `## Configuration` with the
tiny subsections `### Port` and `### Timeout` becomes one snippet `Configuration`.

**MkDocs/Zensical extensions.**

| Element | Handling |
|---|---|
| Front matter | metadata (title, description, tags), not in the text |
| Admonitions `!!! warning "Caution"` | `> **Caution:** …`, content stays |
| Content tabs `=== "Linux"` | `**Linux:**`, content stays |
| Includes `--8<-- "file.md"` | are resolved, content from the repo inserted – also from outside the path (see Sync) |
| URL includes `--8<-- "https://…"` | fetched only when the site sets `url_download: true` and the origin is listed in `INCLUDE_URL_ALLOW` (ADR 0004); otherwise a warning |
| Mermaid | stays a code block |
| Images | alt text stays, URL is dropped |
| HTML comments | are dropped |

**Links.** Relative links (`deploy.md#rollback`) become grimoire IDs
(`platform/auth-service/deploy#rollback`), so agents can follow them with `read`. As a side
effect, this yields backlinks and dead links for the admin area. A relative link that leaves the
source's path is broken in MkDocs as well and counts as dead.

**IDs.** `<source>/<file without .md>#<anchor>`. Anchors are derived from the heading
exactly as in MkDocs (duplicates get `_1`, `_2`), so grimoire IDs and the rendered page match.
Zensical uses the same `toc` extension of Python-Markdown as MkDocs for this. grimoire reads
`toc.slugify` and the separator from the site's `mkdocs.yml` or `zensical.toml` and reproduces
the default slugify, `slugify_unicode` and `pymdownx.slugs.slugify` with its options. Any other
slug function falls back to the default and is reported as a warning: its anchors may differ from
the rendered page.

**Output format.** Like Context7, but without a generated description and with an "Edit:" line:

- `Source:` – grimoire ID, with which the agent reads on via `read`.
- `Edit:` – Git URL, branch and file: where to make changes outside grimoire. Deliberately no web
  links, whose structure differs per provider.

````
### auth-service › Deployment › Rollback
Source: auth-service/deploy#rollback
Edit: https://gitlab.thoemo.net/platform/auth-service.git (main) docs/deploy.md

On errors after a deploy, go back to the previous version:

```bash
make rollback ENV=prod VERSION=<tag>
```

> **Caution:** database migrations are not rolled back.
````

No LLM-generated one-line description per snippet in version 1 – it costs on every sync, and the
title path is usually enough.

## Search

**Version 1: full text.** SQLite FTS5 with BM25 over the snippets, weighted: title path strong,
text normal, code weak. Internal docs are full of proper names and commands (`auth-service`,
`make rollback`), where full text often hits better than semantic search. Fast, free, no
embedding model needed. Weakness: synonyms ("deploy" does not find "release process").

**Version 2: hybrid.** Full text and embeddings (`sqlite-vec`) in parallel, results merged by
Reciprocal Rank Fusion. Comes once missing synonyms get in the way in practice.

**Across everything without sources.** `query` without sources searches all sources; with a list
of sources, it is restricted to them.

**Token budget.** `query` fills the budget (`--tokens`, default 3,000) like this:

1. fetch the best hits by ranking
2. pack them in order until the budget is full
3. if a hit no longer fits, skip it and try the next one
4. at the end, a line with the IDs of the hits that no longer fit – the agent knows there is
   more and can call `read` specifically

## Sync

grimoire speaks only Git, no provider API. That way every Git server works the same.

**Checking (polling on a schedule).** Every source is checked by its cron expression, a source
without one by the global default (`SYNC_SCHEDULE`, every 5 minutes); schedules run in the time
zone `TZ`. A paused source is skipped, and the setting "Pause all syncs" skips every source;
"Sync now" still works for both. A cron expression instead of an interval,
because some Git servers allow only a few requests and some sources rarely change.
`git ls-remote <url> refs/heads/<branch>` returns the current commit hash without downloading
anything. Unchanged → do nothing. In addition, a "Sync now" button in the admin area. Webhooks
later – every provider has its own format.

**Ingesting.** Shallow sparse clone into a temporary directory, only the configured path:

```
git clone --depth 1 --filter=blob:none --sparse --branch main <url> tmp/
git -C tmp sparse-checkout set docs
```

Includes whose target lies outside the path are fetched with
`git -C tmp sparse-checkout add <directory of the target>` (cone mode only takes directories),
repeated until no new targets turn up – includes can contain includes themselves. This is sure to
end, because every round only fetches directories not yet checked out. When inserting, by
contrast, a cycle (`a.md` → `b.md` → `a.md`) would be endless: if a file is already in the
current include chain, it is not inserted again but reported as a warning. If a target is missing
from the repo as well, that is reported as a warning. Then split and delete the directory. No
permanent clone.

**Access.** HTTPS with the token as password; all providers support that. SSH deploy keys perhaps
later.

**Rebuilding completely.** When a source changes, its whole index is rebuilt. The new pages,
snippets and links are written under the source's next generation in short transactions, so other
writers never wait long; switching the generation makes them live at once, and the old ones are
deleted afterwards. Deleted and moved files take care of themselves; agents never see a half
index. Doc repos are small – only very large collections make a per-file comparison worthwhile.
Indexing one source may take at most `INDEXING_DEADLINE_MINUTES` (default 10), or the sync fails.

**Errors.** If the sync fails, the last good state stays active; the error is shown at the source
in the admin area and in its sync history. A broken file is skipped and reported as a warning, the rest is ingested.

**Moved files.** If the path changes, the ID changes and links to it become dead. grimoire shows
dead links in the admin area; redirects perhaps later.

## Interface for agents

Four operations:

```
sources                                    sources with short description
index <source>                             pages and sections (from nav or the file tree)
query [<source>…] "<question>" --tokens 3000  matching snippets up to the budget, across all without sources
read <source>/<page>[#section]             whole page or one section
```

Offered through an **HTTP API and an MCP server in the same app**. A CLI comes later or not at
all.

- **MCP** (remote, only URL and API key): nothing to install, works in every client that sends
  the key as a header, such as Claude Code. Access only by API key, no OAuth – clients that
  connect exclusively via OAuth are left out. Four tools cost only a few hundred tokens of
  context.
- **HTTP** answers with Markdown instead of JSON, so agents can also access it via curl or
  WebFetch:

```
GET /sources
GET /query?q=rollback&tokens=3000
GET /query?q=rollback&source=auth-service&source=gateway
GET /sources/auth-service
GET /sources/auth-service/llms.txt
GET /p/auth-service/deploy
GET /p/auth-service/deploy?section=rollback
```

HTTP clients do not send the part after `#` to the server. That is why, over HTTP, the anchor of
the ID becomes `?section=`. This way an agent can also work its way from `query` to a single
section over HTTP instead of loading whole pages. Over MCP, the ID stays unchanged, including `#`.

## Authentication

- **Agents:** without an API key, a request reads and searches the public sources. An API key,
  created in the admin area, adds all sources or a selection; it never hides a public source. A
  key may have a last day it is valid. grimoire only reads, so that is enough (ADR 0003).
- **Admin area:** local users with roles; today the one role is `admin`. The first admin is
  created by the setup, which needs the setup token from the server log and stays open while no
  user has the role `admin`. Forgotten passwords are reset by a link sent by mail, valid for one
  hour. Login via OAuth (GitLab, GitHub …) is possible later.

Agents change docs in the respective repo (edit the file, commit). Conceivable later: a `write`
operation in grimoire for agents without a checkout. A direct commit via `git push` works with
every provider; MR/PR would be provider-specific.

## Instructions for agents

grimoire serves the instructions itself, maintained in one place:

- **MCP instructions:** land in the context automatically as soon as the server is connected. MCP
  users need no block in CLAUDE.md.
- **`GET /instructions`:** the same text for agents without MCP. CLAUDE.md then only says:

```markdown
## grimoire
Internal knowledge: read `curl -H "Authorization: Bearer $GRIMOIRE_KEY" https://grimoire.example/instructions`
once per session and follow it.
```

Budget: under 250 tokens, because the text stays in the context permanently. The text, kept in
`app/src/lib/server/agent/instructions.md`:

```markdown
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
```

When a change arrives in grimoire is deliberately not in the text: the sync interval is a matter
of operations and none of the agents' business.

## Stack and operations

- **SvelteKit + TypeScript:** admin area, HTTP API and MCP server (official TypeScript SDK,
  Streamable HTTP) in one app.
- **Markdown splitting with `remark`/`mdast`:** the syntax tree knows headings, code blocks,
  lists and tables – the prerequisite for "never cut inside a code block". Admonitions and tabs
  are converted to plain Markdown beforehand.
- **SQLite with FTS5:** real BM25 with weighting per column, one file, no second database.
  Embeddings later with `sqlite-vec`. Limit: one instance – sufficient for an organization's
  knowledge base.
- **Polling** in the same process by timer.
- **Token counting** estimated (characters / 4); exact tokenizers differ per model.
- **Texts** of the web UI as messages per language (Paraglide), English and German.
- **Mail** over SMTP, for password reset links.
- **Operations:** one Docker image (Node + git), one volume for the SQLite file. Deployment
  configuration (encryption key, polling schedule, time zone, SMTP, allowed include origins …) via
  environment variables, documented in `app/src/env.ts`; settings an admin changes at runtime in
  the database (ADR 0002).

## Repository

- **Name:** grimoire
- **License:** MIT
- **Description:** Self-hosted knowledge base for AI agents. Indexes Markdown docs from your Git
  repositories into searchable snippets and serves them via MCP and HTTP.
- **Topics:** `mcp`, `ai-agents`, `documentation`, `knowledge-base`, `markdown`, `mkdocs`,
  `llms-txt`, `self-hosted`
- **README:** the relation to Context7 goes there, not in the description ("Inspired by Context7,
  which does this for public libraries.") – descriptive, without any appearance of affiliation.

## Deliberately not in version 1

| What | Why / when |
|---|---|
| Web UI for reading, editor | humans read through MkDocs/Zensical, writing happens in the repo; the start page only lists sources and tries a query |
| Writing through grimoire (`write`) | only once agents have to write without a checkout |
| Embeddings / hybrid search | only once missing synonyms get in the way in practice |
| Webhooks | polling is enough; webhook formats differ per provider |
| CLI | HTTP and MCP cover everything |
| OAuth login, SSH deploy keys | local users and HTTPS token are enough to start |
| Redirects for moved files | dead links are shown and fixed in the repo |
| LLM-generated snippet descriptions | costs on every sync, title path is enough |
| Multiple instances / horizontal scaling | SQLite, one instance is enough |
| HTML sources (rendered MkDocs/Zensical sites) | version 2: for docs without repo access. HTML → Markdown, then the same splitting. Open: cutting out the content per theme, change detection without `ls-remote`, `Edit:` line, SSO |

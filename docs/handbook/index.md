# Concepts

!!! info "Prerequisites"
    - Reader: anyone new to grimoire, before reading the page for their role.

grimoire serves the Markdown documentation in your Git repositories to AI agents. It reads the
repositories, splits every page into snippets along its headings, and answers an agent's search
with the matching snippets that fit the agent's token budget. Documentation stays in Git: people
and agents change it there, and grimoire only reads it.

## Roles

| Role | Does | Reads |
|---|---|---|
| Operator | Runs the container, sets its environment, keeps the database and its backups. | [Running grimoire](docker.md), [Database](database.md) |
| Admin | Sets up projects, sources and API keys in the management area, watches syncs. | [Management area](admin.md) |
| Agent developer | Connects an agent with an API key. | [Connecting agents](agents.md) |
| Author | Writes the documentation in Git, as a person or an agent. | [Writing documentation](writing.md) |

In a small team one person often holds several roles; each page is written for one of them.

## How the parts fit

```text
Git repository ──sync──▶ source ─┐
Git repository ──sync──▶ source ─┼─▶ project ──▶ search, read ──▶ agent (API key)
                                 │
                   pages ─▶ snippets with IDs
```

- Project: what agents search as a whole, such as `platform`. An API key opens all projects
  or a selection.
- Source: one Git repository, one branch and one path in it, such as `docs/` on `main`. A
  project has one or more.
- Sync: grimoire checks every source on a schedule and reads it again when its branch moved.
  Until a sync is complete, agents get answers from the previous one.
- Snippet: one heading with the text below it. Agents get snippets, never whole pages, unless
  they ask for one.
- ID: every page and snippet has one, `<project>/<source>/<page>#<anchor>`, such as
  `platform/auth-service/deploy#rollback`. Agents read on and link with it.
- Token budget: how much text an agent accepts per search, about four characters per token.
  grimoire returns the best matches that fit.

## Getting started

1. The operator starts the container and passes the setup token from its log to the admin
   ([Running grimoire](docker.md)).
2. The admin creates the admin account, a project with its first source, and an API key
   ([Management area](admin.md)).
3. The agent developer connects an agent with that key ([Connecting agents](agents.md)).
4. Authors keep writing in Git; every sync brings their changes to the agents
   ([Writing documentation](writing.md)).

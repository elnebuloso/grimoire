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
| Admin | Invites and manages users, manages every source and the instance's settings, watches syncs. | [Management area](admin.md) |
| User | Adds their own sources and creates their own API keys. | [Your sources and API keys](users.md) |
| Agent developer | Connects an agent, with an own API key for sources that are not public. | [Connecting agents](agents.md) |
| Author | Writes the documentation in Git, as a person or an agent. | [Writing documentation](writing.md) |

In a small team one person often holds several roles; each page is written for one of them.

## How the parts fit

```text
Git repository ──sync──▶ source ─┐
Git repository ──sync──▶ source ─┴─▶ search, read ──▶ agent (API key)
                           │
             pages ─▶ snippets with IDs
```

- Source: one Git repository, one branch and one path in it, such as `docs` on `main`, with a
  name and a slug such as `auth-service`. Two documentation paths in one repository are two
  sources. Agents search all sources or name the ones they want.
- Visibility: a public source can be searched and read without an API key; an internal one with
  the API key of any user; a private one only with the keys of its owner. A new source is private.
- Owner: the user who created a source or API key. Owners and admins change and delete sources;
  every key belongs to one user.
- Sync: grimoire checks every source on a schedule and reads it again when its branch moved.
  Until a sync is complete, agents get answers from the previous one.
- Snippet: one heading with the text below it. A search returns snippets; an agent gets a whole
  page only when it reads one.
- ID: every page and snippet has one, `<source>/<page>#<anchor>`, such as
  `auth-service/deploy#rollback`. Agents read on and link with it.
- Token budget: how much text an agent accepts per search, about four characters per token.
  grimoire returns the best matches that fit.

## Getting started

1. The operator starts the container and passes the setup token from its log to the admin
   ([Running grimoire](docker.md)).
2. The admin creates the admin account and invites the other users
   ([Management area](admin.md)).
3. Users add sources and create their API keys ([Your sources and API keys](users.md)).
4. The agent developer connects an agent with such a key ([Connecting agents](agents.md)).
5. Authors keep writing in Git; every sync brings their changes to the agents
   ([Writing documentation](writing.md)).

# Connecting agents

!!! info "Prerequisites"
    - Reader: agent developer.
    - Required access: an API key from an admin, and the address of the instance, such as
      `https://grimoire.example.com`. The key decides which sources the agent sees.

    New to grimoire? Read [Concepts](index.md) first.

Send the key with every request as `Authorization: Bearer <YOUR_API_KEY>`. Keep it in an
environment variable such as `GRIMOIRE_KEY`, never in a file you commit.

## Operations

MCP and HTTP offer the same four:

| Operation | Returns |
|---|---|
| `sources` | The sources the key may read, with their short description. |
| `index` | The pages and sections of one source, with their IDs. |
| `query` | The snippets matching a search, from the given sources or all, within a token budget, default 3000. Only the first 500 characters of the search count. |
| `read` | A page, `auth-service/deploy`, or one section, `auth-service/deploy#rollback`. |

Every snippet starts with its title path, a `Source:` line with the ID to `read` on, and an
`Edit:` line with Git URL, branch and file to change it:

```text
### auth-service › Deployment › Rollback
Source: auth-service/deploy#rollback
Edit: https://git.example.com/platform/auth-service.git (main) docs/deploy.md
```

## MCP

Endpoint `/mcp`, Streamable HTTP, tools `sources`, `index`, `query` and `read`. `query` takes the
sources to search as a list, `sources: ["auth-service", "gateway"]`. Authentication
is the API key header only, without OAuth. With Claude Code:

```bash
claude mcp add --transport http grimoire https://grimoire.example.com/mcp \
  --header "Authorization: Bearer <YOUR_API_KEY>"
```

The start page `/` of the instance shows this command with its address filled in.

The server sends its instructions on connect: when to search, how to read on, how to change
documentation. An agent connected over MCP needs nothing about grimoire in its `CLAUDE.md`.

## HTTP

Every route answers in Markdown, so `curl` or `WebFetch` is enough:

| Route | Operation |
|---|---|
| `GET /instructions` | The instructions the MCP server sends. |
| `GET /sources` | `sources` |
| `GET /query?q=<terms>&tokens=<budget>` | `query` across all sources |
| `GET /query?q=<terms>&source=<source>&source=<source>` | `query` in the given sources |
| `GET /sources/<source>` | `index` |
| `GET /sources/<source>/llms.txt` | The source's pages in the `llms.txt` format. |
| `GET /p/<source>/<page>` | `read` of a page |
| `GET /p/<source>/<page>?section=<anchor>` | `read` of one section |

HTTP clients do not send what follows `#`, so the anchor of an ID goes into `?section=`:

```bash
curl -H "Authorization: Bearer $GRIMOIRE_KEY" \
  "https://grimoire.example.com/p/auth-service/deploy?section=rollback"
```

## Errors

| Status | Text | Fix |
|---|---|---|
| `401` | ``Missing or invalid API key. Send `Authorization: Bearer <key>`.`` | Send the header. The key may be revoked or past its expiry date: ask the admin. |
| `400` | ``Missing search terms. Send `?q=<terms>`.`` | Add `q`. |
| `400` | `` `tokens` must be a positive whole number. `` | Send a whole number, such as `tokens=3000`. |
| `404` | ``Source "billing" not found. See `sources`.`` | Use a source from `sources`; the key may not include it. |
| `404` | ``"auth-service/deploy#rolback" not found. The source's `index` lists all IDs.`` | Take the ID from `index`; IDs change when a heading, file or slug changes. |
| `500` | `The server failed to answer. Try again later.` | Retry later; tell the operator if it persists. |

Over MCP, `404` and `500` come back as tool errors with the same texts, invalid arguments as
tool errors naming the argument, and a missing key as HTTP `401`. A search without results is not
an error: `query` answers
``No results for "release train". Try other terms, or look at a source's `index`.``

## The `CLAUDE.md` snippet

For an agent without MCP, add this block to its `CLAUDE.md` or `AGENTS.md`:

```markdown
## grimoire
Internal knowledge: read `curl -H "Authorization: Bearer $GRIMOIRE_KEY" https://grimoire.example.com/instructions`
once per session and follow it.
```

## Changing documentation

grimoire only reads. An agent changes documentation like a person: it edits the file named in the
`Edit:` line in its repository and commits it. The change reaches agents with the next sync of the
source: within 5 minutes, unless the instance or the source has another schedule. How to write pages that split well:
[Writing documentation](writing.md).

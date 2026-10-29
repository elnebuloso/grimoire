# Connecting agents

Agents reach grimoire over MCP or plain HTTP. Both offer the same four operations and both need
an API key, sent as `Authorization: Bearer <key>`. Create keys in the admin area under
**API keys**; a key sees all projects or a selection of them (see [Admin area](admin.md#api-keys)).

| Operation | What it returns |
|---|---|
| `projects` | The projects the key may read, with their short description. |
| `index` | The pages and sections of one project, with their IDs. |
| `query` | The snippets matching a search, from one project or all, within a token budget (default 3000). |
| `read` | A whole page, `project/source/page`, or one section, `project/source/page#anchor`. |

Every snippet starts with its title path, a `Source:` line with its ID, to `read` more, and an
`Edit:` line with the Git URL, branch and file, to change it:

```text
### platform › auth-service › Deployment › Rollback
Source: platform/auth-service/deploy#rollback
Edit: https://git.example.com/platform/auth-service.git (main) docs/deploy.md
```

## MCP

The MCP server lives at `/mcp` (Streamable HTTP) and offers the operations as the tools
`projects`, `index`, `query` and `read`. Access is by API key only, without OAuth, so any client
that can send the key as a header works. With Claude Code:

```bash
claude mcp add --transport http grimoire https://grimoire.example.com/mcp \
  --header "Authorization: Bearer <key>"
```

The server sends its instructions when the client connects: when to search, how to read on and
how to change documentation. An agent connected over MCP needs nothing else in its `CLAUDE.md`.

## HTTP

For agents without MCP, the same operations answer in Markdown, so `curl` or `WebFetch` is enough.

| Route | Operation |
|---|---|
| `GET /instructions` | The instructions the MCP server sends. |
| `GET /projects` | `projects` |
| `GET /query?q=<terms>&tokens=<budget>` | `query` across all projects |
| `GET /p/<project>/query?q=<terms>&tokens=<budget>` | `query` in one project |
| `GET /p/<project>/index` | `index` |
| `GET /p/<project>/llms.txt` | The pages of a project in the `llms.txt` format. |
| `GET /p/<project>/<source>/<page>` | `read` of a whole page |
| `GET /p/<project>/<source>/<page>?section=<anchor>` | `read` of one section |

HTTP clients do not send the part of a URL after `#`, so over HTTP the anchor of an ID becomes
`?section=`.

## The `CLAUDE.md` snippet

An agent without MCP learns about grimoire from one block in its `CLAUDE.md` or `AGENTS.md`. It
points to `/instructions` instead of repeating them, so the instructions stay in one place:

```markdown
## grimoire
Internal knowledge: read `curl -H "Authorization: Bearer $GRIMOIRE_KEY" https://grimoire.example.com/instructions`
once per session and follow it.
```

Provide the key as the environment variable `GRIMOIRE_KEY` wherever the agent runs, never in the
file itself.

## What agents change

grimoire only reads. Agents change documentation where people do: they edit the Markdown file
named in the `Edit:` line in its repository and commit it, and grimoire picks the change up with
the next sync of the source. How to write pages that split into useful snippets is described in
[Writing documentation](writing.md).

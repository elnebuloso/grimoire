<p align="center">
  <img src="logo.png" alt="grimoire" width="128">
</p>

<h1 align="center">grimoire</h1>

<p align="center">
  Self-hosted knowledge base for AI agents. Indexes Markdown docs from your Git repositories into
  searchable snippets and serves them via MCP and HTTP.
</p>

<p align="center">
  <a href="https://elnebuloso.github.io/grimoire/">Handbook</a> ·
  <a href="https://github.com/elnebuloso/grimoire/releases">Releases</a>
</p>

Inspired by [Context7](https://context7.com), which does this for public libraries. grimoire does
it for the internal knowledge of an organisation: how your services, tools and processes work and
how to use them.

## How it works

- **Git is the source of truth.** People and agents write Markdown in Git repositories (GitLab,
  GitHub, Forgejo, Gitea …). History, review and permissions come from Git.
- **grimoire only reads.** It syncs the repositories, splits every page into snippets along its
  headings and keeps them in a full-text index. MkDocs and Zensical syntax (admonitions, tabs,
  snippet includes) is understood.
- **Agents get little context.** A query returns only the matching sections within a token
  budget. Each snippet carries its ID, to read more, and the repository, branch and file, to edit
  it.
- **Humans read the docs where they already do**, for example in MkDocs or Zensical.

## Status

Before `1.0.0`. Sync, search, the HTTP API and the MCP server work. The admin area and the Docker
image are not built yet: projects and sources are not yet managed through a UI, and API keys are
created with `make api-key`.

## Connecting agents

Every request needs an API key: `Authorization: Bearer <key>`. A key sees all projects or a
selection of them.

### MCP

The MCP server lives at `/mcp` (Streamable HTTP) and offers the tools `projects`, `index`,
`query` and `read`. Its instructions tell the agent how to use them. Access is by API key only,
so any client that can send the key as a header works, for example Claude Code:

```bash
claude mcp add --transport http grimoire https://grimoire.example/mcp \
  --header "Authorization: Bearer <key>"
```

### HTTP

For agents without MCP, the same operations answer in Markdown, so `curl` or `WebFetch` is enough.

| Route | Answer |
|---|---|
| `GET /instructions` | How agents use grimoire |
| `GET /projects` | Projects with their short description |
| `GET /query?q=<terms>&tokens=<budget>` | Matching snippets from all projects, default budget 3000 |
| `GET /p/<project>/index` | Pages and sections of a project with their IDs |
| `GET /p/<project>/llms.txt` | The pages of a project as [llms.txt](https://llmstxt.org) |
| `GET /p/<project>/query?q=<terms>&tokens=<budget>` | Matching snippets from one project |
| `GET /p/<project>/<source>/<page>` | A whole page; `?section=<anchor>` for one section |

An agent without MCP needs one line in its `CLAUDE.md` or `AGENTS.md`:

```markdown
## grimoire
Internal knowledge: read `curl -H "Authorization: Bearer $GRIMOIRE_KEY" https://grimoire.example/instructions`
once per session and follow it.
```

## Running

grimoire needs Node 24.22.1 or newer and `git`.

```bash
cp app/.env.example app/.env   # then set TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
npm --prefix app ci
make dev                       # or: make build, then in app/: node --env-file=.env build
make api-key NAME=my-agent     # all projects; PROJECTS=a,b for a selection
```

The environment variables, the volume for the SQLite file, the sync schedule and backups are
described in [docs/handbook/database.md](docs/handbook/database.md).

## Development

`make help` lists all targets; `make test` runs the unit tests, `make e2e` the browser tests of
the admin area against the production build (it downloads Chromium on first use), `make lint`
checks formatting, lint rules and types.

Commits follow [Conventional Commits](https://www.conventionalcommits.org). Releases are cut from
them by the `Release` workflow on every push to `main`: `feat` raises the minor
version, `fix` the patch version, other types release nothing.

## License

[MIT](LICENSE)

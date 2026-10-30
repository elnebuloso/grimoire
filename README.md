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

Before `1.0.0`. Sync, search, the HTTP API, the MCP server, the management area and the Docker image
work. Every release publishes its Docker image as `elnebuloso/grimoire:<version>`. `0.x` releases are
previews without an upgrade path: a later release may need a fresh database.

## Connecting agents

Every request needs an API key: `Authorization: Bearer <key>`. Keys are created in the management area
under **API keys**; a key sees all projects or a selection of them.

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

With Docker: the image of every release is `elnebuloso/grimoire:<version>` (no `latest`). It
expects a reverse proxy in front; the handbook has a ready
[Docker Compose setup](https://elnebuloso.github.io/grimoire/docker/#docker-compose), the
environment variables and notes for Kubernetes.

Without Docker, grimoire needs Node 24.22.1 or newer and `git`:

```bash
make setup   # creates app/.env with a new TOKEN_ENCRYPTION_KEY, installs the dependencies
make dev     # or: make build, then in app/: node --env-file=.env build
```

Open `/manage`, set up the admin account with the setup token from the log, add a project with a
source and create an API key under **API keys**.

The container, its environment variables and the reverse proxy are described in
[docs/handbook/docker.md](docs/handbook/docker.md); the volume for the SQLite file, the encryption
key and backups in [docs/handbook/database.md](docs/handbook/database.md).

## Development

`make help` lists all targets; `make test` runs the unit tests and the component stories,
`make e2e` the browser tests of the management area against the production build (both download
Chromium on first use), `make lint` checks formatting, lint rules and types. `make storybook`
opens the component catalog; [.claude/rules/ui-components.md](.claude/rules/ui-components.md) says
how components and their stories are written. `make mail-catcher` receives the mails of `make dev`
(see `app/.env.example`); `make e2e` starts its own. Both need Docker.

Until `1.0.0` the schema changes in place in `app/src/lib/server/db/migrations/0001-initial.sql`,
without new migration files. After pulling a schema change, delete `app/data/`: grimoire refuses a
database with `database schema is at version …, this grimoire knows only 1`, and a database at
version 1 silently keeps the old schema.

Commits follow [Conventional Commits](https://www.conventionalcommits.org). Releases are cut from
them by the `CI` workflow on every push to `main`, once lint, unit and browser tests passed:
`feat` raises the minor version, `fix` the patch version, other types release nothing. Pull
requests run the same checks without releasing.

## License

[MIT](LICENSE)

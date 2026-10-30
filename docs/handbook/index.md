# grimoire

grimoire is a self-hosted knowledge base for AI agents. It reads Markdown documentation from Git
repositories, splits every page into snippets along its headings and serves the matching ones to
agents within a token budget, over MCP and HTTP. People and agents keep writing the documentation
in Git; grimoire only reads it.

This handbook is for the people who run grimoire, connect agents to it and write the
documentation it serves.

- [Running with Docker](docker.md): the image, Docker Compose, Kubernetes, the environment and the
  volume.
- [Database](database.md): configuration, the volume for the SQLite file, the sync schedule,
  access tokens and backups.
- [Management area](admin.md): users and roles, projects and sources, their status, API keys and a
  lost password.
- [Connecting agents](agents.md): MCP, HTTP and the `CLAUDE.md` snippet.
- [Writing documentation](writing.md): pages that split into useful snippets.

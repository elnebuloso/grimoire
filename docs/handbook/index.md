# grimoire

grimoire is a self-hosted knowledge base for AI agents. It reads Markdown documentation from Git
repositories, splits every page into snippets along its headings and serves the matching ones to
agents within a token budget, over MCP and HTTP. People and agents keep writing the documentation
in Git; grimoire only reads it.

This handbook is for the people who run grimoire.

- [Running with Docker](docker.md): building the image, starting the container, its environment
  and volume.
- [Database](database.md): configuration, the volume for the SQLite file, the sync schedule,
  access tokens and backups.
- [Admin area](admin.md): the admin account, projects and sources, their status, API keys and a
  lost password.

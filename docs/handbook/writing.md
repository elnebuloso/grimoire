# Writing documentation

grimoire never hands an agent a whole page. It splits every page into snippets along its headings
and serves only the ones that match a search, each on its own. Documentation works well in
grimoire when every snippet still makes sense without the rest of the page. These rules are for
everyone who writes it, people and agents alike.

## One topic per file

A page covers one service, tool or process. Two topics in one file mix their sections in search
results and give both the same `Edit:` file; split them into two pages that link to each other.
Before writing a new page, search whether the topic exists already and extend that page instead of
adding a second one.

## Every section stands on its own

Each heading with the text below it becomes one snippet, and an agent may see nothing but that
snippet. Write every section so it can be understood alone:

1. a descriptive heading: `Rolling back a deploy`, not `Rollback` or `Notes`;
2. one sentence of context: what it is about and when it applies;
3. then the specifics: commands, values, steps.

Do not rely on what an earlier section said ("as above", "this service"). Every snippet carries
its title path, for example `platform › auth-service › Deployment › Rollback`, so the project,
source and parent headings need not be repeated in the text.

## How a page is split

| Part of the page | Becomes |
|---|---|
| Text under `#` before the first `##` | The snippet `Overview`; also the page description in the index, unless the front matter has a `description`. |
| Each heading with its section | One snippet. |
| A section of less than about 50 tokens | Merged into its parent section. |
| A section of more than about 800 tokens | Cut at its subheadings, otherwise between paragraphs, into parts named `Rollback (1/2)`, `Rollback (2/2)`; never inside a code block, table or list. |

A token is roughly four characters. Sections of a few paragraphs fit best; very short ones lose
their own heading, very long ones lose their context in the second part.

## IDs and links

The ID of a snippet is `<project>/<source>/<file without .md>#<anchor>`, with the anchor built
from the heading exactly as MkDocs and Zensical build it. Renaming a heading or moving a file
changes the ID, and links to the old one become dead links, which the management area lists.

Link to other pages with relative links, as MkDocs expects them: `deploy.md#rollback`. grimoire
turns them into IDs, so agents can follow them with `read`. A link that leaves the path of the
source is broken in MkDocs as well and counts as dead.

## MkDocs and Zensical syntax

Pages are written for MkDocs or Zensical and read by people there. grimoire understands their
extensions and turns them into plain Markdown for agents:

| Element | In the snippet |
|---|---|
| Front matter | Title, description and tags become metadata; they are not in the text. |
| Admonitions `!!! warning "Caution"` | `> **Caution:** …`, with the content. |
| Content tabs `=== "Linux"` | `**Linux:**`, with the content. |
| `nav` in `zensical.toml` or `mkdocs.yml` | The order of the pages in the index; pages missing from `nav` follow by path. The first of the two files found in the source path or above it counts. |
| `toc` `slugify` and `separator` in the site config | Heading IDs are built the same way, for `pymdownx.slugs.slugify` with its options, `markdown.extensions.toc.slugify` and `slugify_unicode`. Any other function falls back to the default and shows a warning at the source. |
| Includes `--8<-- "file.md"` | The included file, also from outside the path of the source. |
| Symlinks | Followed while they point to a file inside the repository. A page or include that points outside it is skipped with a warning at the source, so a commit cannot make grimoire read files of the server. |
| Partial includes `--8<-- "file.md:4:6"`, `--8<-- "app.py:main"` | Only the selected lines, or the lines between `--8<-- [start:main]` and `--8<-- [end:main]`; the markers themselves are dropped everywhere. |
| URL includes `--8<-- "https://…/file.md"` | The fetched file, when the site config sets `url_download: true` under `pymdownx.snippets` and the operator allows its origin in `INCLUDE_URL_ALLOW`. A file included by URL may include further URLs only. Anything not fetched (not allowed, a redirect, an error, more than 1 MiB or 10 seconds) is a warning at the source. The file is fetched at every sync, not when it changes. |
| Mermaid diagrams | Kept as a code block. |
| Images | Only the alt text; write one that says what the image shows. |
| HTML comments | Dropped. |
